"""
Parses .docx files into a structured section tree + HTML with KaTeX-ready
math delimiters ($$...$$ for display, $...$ for inline) and extracts embedded images.

Word doesn't store "real" LaTeX for its equations (OMML instead), so as a
pragmatic approach we:
  1. Walk paragraphs in document order.
  2. Classify each paragraph as heading (levels 1-4) or body text using the
     paragraph's Word style name or regex patterns (e.g., "1. INTRODUCTION").
  3. Detect inline runs that look like simple math (heuristic: wrapped in
     literal $...$ by the author, OR containing common math operators) and
     wrap them so KaTeX can render them client-side. OMML equations (native
     Word equation objects) are converted to a best-effort LaTeX string.
  4. Extract all embedded images and save them to media storage.
  5. Build a section tree: [{"heading": heading, "level": level, "content_html": ...}]
"""

import re
import os
import uuid
from docx import Document
from docx.oxml.ns import qn
from typing import List, Dict

HEADING_STYLE_RE = re.compile(r"heading\s*(\d)", re.IGNORECASE)
NUMBERED_HEADING_RE = re.compile(r"^\d+(\.\d+)*\.?\s+[A-Z0-9]")

ASSET_DIR = "data/assets"
os.makedirs(ASSET_DIR, exist_ok=True)

# Very small OMML -> LaTeX converter covering common constructs (fractions,
# superscripts, subscripts, radicals). Production systems would use a fuller
# converter (e.g. Pandoc); this keeps the project dependency-light.
def omml_to_latex(omml_element) -> str:
    ns = {"m": "http://schemas.openxmlformats.org/officeDocument/2006/math"}

    def walk(el):
        tag = el.tag.split("}")[-1]
        if tag == "f":  # fraction
            num = el.find("m:num", ns)
            den = el.find("m:den", ns)
            return f"\\frac{{{walk_children(num)}}}{{{walk_children(den)}}}"
        if tag == "sSup":  # superscript
            base = el.find("m:e", ns)
            sup = el.find("m:sup", ns)
            return f"{{{walk_children(base)}}}^{{{walk_children(sup)}}}"
        if tag == "sSub":  # subscript
            base = el.find("m:e", ns)
            sub = el.find("m:sub", ns)
            return f"{{{walk_children(base)}}}_{{{walk_children(sub)}}}"
        if tag == "rad":  # radical / sqrt
            deg = el.find("m:deg", ns)
            e = el.find("m:e", ns)
            deg_txt = walk_children(deg) if deg is not None else ""
            if deg_txt.strip():
                return f"\\sqrt[{deg_txt}]{{{walk_children(e)}}}"
            return f"\\sqrt{{{walk_children(e)}}}"
        if tag == "t":
            return el.text or ""
        # default: concat children
        return walk_children(el)

    def walk_children(el):
        if el is None:
            return ""
        return "".join(walk(child) for child in el)

    try:
        return walk(omml_element)
    except Exception:
        return ""


def paragraph_to_html(paragraph) -> str:
    """Convert a paragraph (with runs + inline OMML) into an HTML fragment,
    wrapping detected math in KaTeX delimiters."""
    pieces = []
    p_xml = paragraph._p

    for child in p_xml:
        tag = child.tag.split("}")[-1]
        if tag == "oMath" or tag == "oMathPara":
            latex = omml_to_latex(child)
            if tag == "oMathPara":
                pieces.append(f" $${latex}$$ ")
            else:
                pieces.append(f" ${latex}$ ")
        elif tag == "r":  # normal run
            texts = child.findall(qn("w:t"))
            run_text = "".join(t.text or "" for t in texts)
            if run_text:
                pieces.append(escape_html(run_text))

    html = "".join(pieces) if pieces else escape_html(paragraph.text)
    # Author-authored literal LaTeX like $E=mc^2$ passes through untouched
    return html


def extract_paragraph_images(paragraph, doc, base_url: str = "http://localhost:8000") -> List[str]:
    """Extract embedded images inside paragraph runs and return img HTML tags."""
    img_tags = []
    for run in paragraph.runs:
        # Check for drawing XML objects (inline and anchored images)
        drawings = run._r.findall(qn("w:drawing"))
        for drawing in drawings:
            blips = drawing.findall(".//" + qn("a:blip"))
            for blip in blips:
                embed_id = blip.get(qn("r:embed"))
                if embed_id and embed_id in doc.part.rels:
                    image_part = doc.part.rels[embed_id].target_part
                    img_ext = image_part.content_type.split("/")[-1]
                    if img_ext not in ["png", "jpeg", "jpg", "gif", "webp"]:
                        img_ext = "png"
                    
                    filename = f"img_{uuid.uuid4().hex[:8]}.{img_ext}"
                    filepath = os.path.join(ASSET_DIR, filename)

                    with open(filepath, "wb") as f:
                        f.write(image_part.blob)

                    img_url = f"{base_url}/assets/{filename}"
                    img_tags.append(
                        f'<div className="my-4"><img src="{img_url}" alt="Document image" className="rounded-lg max-w-full h-auto mx-auto shadow-sm" /></div>'
                    )
    return img_tags


def escape_html(text: str) -> str:
    return (
        text.replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
    )


def parse_docx(file_path: str) -> Dict:
    """Returns {sections: [...], html_content: str, raw_text: str}"""
    doc = Document(file_path)
    sections: List[Dict] = []
    current = {"heading": "Introduction", "level": 1, "content_html": "", "content_text": ""}
    html_parts = []
    raw_text_parts = []

    for para in doc.paragraphs:
        style_name = (para.style.name if para.style else "") or ""
        match = HEADING_STYLE_RE.search(style_name)

        # Heading classification (via Word style or regex pattern match)
        is_heading = False
        level = 1
        heading_text = ""

        if match:
            is_heading = True
            level = int(match.group(1))
            heading_text = para.text.strip() or "Untitled Section"
        elif NUMBERED_HEADING_RE.match(para.text.strip()) and len(para.text.strip()) < 100:
            is_heading = True
            level = 2
            heading_text = para.text.strip()

        if is_heading:
            # Flush current section
            if current["content_html"].strip() or sections == []:
                sections.append(current)
            current = {"heading": heading_text, "level": level, "content_html": "", "content_text": ""}
            heading_html = f'<h{min(level+1,6)} class="chapter-heading">{escape_html(heading_text)}</h{min(level+1,6)}>'
            html_parts.append(heading_html)
        else:
            frag = paragraph_to_html(para)
            if frag.strip():
                current["content_html"] += f"<p>{frag}</p>\n"
                current["content_text"] += para.text + "\n"
                html_parts.append(f"<p>{frag}</p>")
                raw_text_parts.append(para.text)

            # Extract any inline image elements in paragraph
            img_htmls = extract_paragraph_images(para, doc)
            for img_html in img_htmls:
                current["content_html"] += f"{img_html}\n"
                html_parts.append(img_html)

    # Flush last section
    if current not in sections:
        sections.append(current)

    # Tables -> simple HTML tables + text rows for RAG
    for table in doc.tables:
        rows_html = []
        for row in table.rows:
            cells = [escape_html(c.text) for c in row.cells]
            rows_html.append("<tr>" + "".join(f"<td>{c}</td>" for c in cells) + "</tr>")
            raw_text_parts.append(" | ".join(c for c in cells))
        table_html = "<table class='chapter-table'>" + "".join(rows_html) + "</table>"
        html_parts.append(table_html)

    return {
        "sections": sections,
        "html_content": "\n".join(html_parts),
        "raw_text": "\n".join(raw_text_parts),
    }