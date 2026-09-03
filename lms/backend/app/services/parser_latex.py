"""
Parses .tex files into the same {sections, html_content, raw_text} shape
as the docx parser, so both feed the same chapter renderer.

Strategy:
  - Strip comments and the preamble (everything before \\begin{document}).
  - Split on \\section / \\subsection / \\subsubsection / \\chapter commands
    to build the section tree.
  - Within each section, math environments ($$..$$, \\[..\\], equation,
    align, etc.) are converted to KaTeX-friendly $$...$$ blocks; inline
    $...$ math is passed through untouched (KaTeX understands it natively).
  - Common text macros (\\textbf, \\textit, \\emph, \\item, itemize/enumerate)
    are converted to simple HTML equivalents.
"""
import re
from typing import List, Dict

SECTION_RE = re.compile(
    r"\\(chapter|section|subsection|subsubsection)\*?\{([^}]*)\}"
)

MATH_ENV_RE = re.compile(
    r"\\begin\{(equation|align|gather|multline|eqnarray)\*?\}(.*?)\\end\{\1\*?\}",
    re.DOTALL,
)

LEVEL_MAP = {"chapter": 1, "section": 1, "subsection": 2, "subsubsection": 3}


def strip_comments(tex: str) -> str:
    # remove unescaped % comments
    return re.sub(r"(?<!\\)%.*", "", tex)


def extract_body(tex: str) -> str:
    m = re.search(r"\\begin\{document\}(.*)\\end\{document\}", tex, re.DOTALL)
    return m.group(1) if m else tex


def convert_math_environments(text: str) -> str:
    text = MATH_ENV_RE.sub(lambda m: f"$$ {m.group(2).strip()} $$", text)
    text = re.sub(r"\\\[(.*?)\\\]", lambda m: f"$$ {m.group(1).strip()} $$", text, flags=re.DOTALL)
    return text


def convert_inline_macros(text: str) -> str:
    text = re.sub(r"\\textbf\{([^}]*)\}", r"<b>\1</b>", text)
    text = re.sub(r"\\textit\{([^}]*)\}", r"<i>\1</i>", text)
    text = re.sub(r"\\emph\{([^}]*)\}", r"<i>\1</i>", text)
    text = re.sub(r"\\underline\{([^}]*)\}", r"<u>\1</u>", text)
    return text


def convert_lists(text: str) -> str:
    def repl_env(env, tag):
        pattern = re.compile(r"\\begin\{%s\}(.*?)\\end\{%s\}" % (env, env), re.DOTALL)

        def inner(m):
            body = m.group(1)
            items = re.split(r"\\item\s*", body)[1:]
            lis = "".join(f"<li>{it.strip()}</li>" for it in items if it.strip())
            return f"<{tag}>{lis}</{tag}>"

        return pattern.sub(inner, text)

    text = repl_env("itemize", "ul")
    text = repl_env("enumerate", "ol")
    return text


def clean_stray_commands(text: str) -> str:
    # drop \label{}, \cite{}, \ref{} etc. (not meaningful for a reader)
    text = re.sub(r"\\(label|cite|ref|footnote)\{[^}]*\}", "", text)
    text = re.sub(r"\\(newline|noindent|par)\b", "", text)
    return text


def paragraphs_to_html(text: str) -> str:
    paras = [p.strip() for p in re.split(r"\n\s*\n", text) if p.strip()]
    html = []
    for p in paras:
        if p.startswith("<ul>") or p.startswith("<ol>"):
            html.append(p)
        else:
            html.append(f"<p>{p}</p>")
    return "\n".join(html)


def parse_tex(file_path: str) -> Dict:
    with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
        raw = f.read()

    raw = strip_comments(raw)
    body = extract_body(raw)

    # split on section-like commands, keeping the delimiters
    parts = SECTION_RE.split(body)
    sections: List[Dict] = []
    html_parts = []
    raw_text_parts = []

    if parts[0].strip():
        sections.append(_build_section("Introduction", 1, parts[0]))

    # parts alternates: [pre, cmd, title, content, cmd, title, content, ...]
    i = 1
    while i < len(parts) - 2:
        cmd, title, content = parts[i], parts[i + 1], parts[i + 2]
        level = LEVEL_MAP.get(cmd, 2)
        sections.append(_build_section(title.strip() or "Untitled Section", level, content))
        i += 3

    for sec in sections:
        html_parts.append(f'<h{min(sec["level"]+1,6)} class="chapter-heading">{sec["heading"]}</h{min(sec["level"]+1,6)}>')
        html_parts.append(sec["content_html"])
        raw_text_parts.append(sec["heading"])
        raw_text_parts.append(sec["content_text"])

    return {
        "sections": sections,
        "html_content": "\n".join(html_parts),
        "raw_text": "\n".join(raw_text_parts),
    }


def _build_section(heading: str, level: int, raw_content: str) -> Dict:
    content = convert_math_environments(raw_content)
    content = clean_stray_commands(content)
    content = convert_lists(content)
    content = convert_inline_macros(content)
    html = paragraphs_to_html(content)
    # plain text version (strip remaining backslash commands + tags) for RAG
    text = re.sub(r"<[^>]+>", " ", html)
    text = re.sub(r"\\[a-zA-Z]+", " ", text)
    return {
        "heading": heading,
        "level": level,
        "content_html": html,
        "content_text": text.strip(),
    }
