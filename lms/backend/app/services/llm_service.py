"""
Thin LLM abstraction:
  - Primary: Google Gemini (via google-generativeai) – controlled by GEMINI_API_KEY.
  - Fallback: local Ollama server – used automatically if Gemini errors out
    (missing key, quota, network) or if LLM_PROVIDER=ollama is set explicitly.

All chat answers are generated with a strict "answer only from context"
system instruction so the RAG chatbot doesn't hallucinate outside the
uploaded chapter.
"""

import json
import logging
import re
import requests
import google.generativeai as genai
from app.core.config import settings

logger = logging.getLogger("llm_service")

# Configure Gemini if key is provided
if settings.GEMINI_API_KEY:
    genai.configure(api_key=settings.GEMINI_API_KEY)

NO_ANSWER_PHRASE = "I couldn't find that in this chapter's notes."


def _gemini_generate(prompt: str, system_instruction: str = "") -> str:
    if not settings.GEMINI_API_KEY:
        raise RuntimeError("GEMINI_API_KEY not configured")

    # Default fallback model if settings.GEMINI_MODEL is invalid or deprecated
    model_name = getattr(settings, "GEMINI_MODEL", "gemini-2.5-flash") or "gemini-2.5-flash"

    try:
        model = genai.GenerativeModel(
            model_name=model_name,
            system_instruction=system_instruction or None,
        )
        response = model.generate_content(prompt)
        return (response.text or "").strip()
    except Exception as e:
        logger.error(f"[llm_service] Gemini execution error with model {model_name}: {e}")
        raise


def _ollama_generate(prompt: str, system_instruction: str = "") -> str:
    full_prompt = f"{system_instruction}\n\n{prompt}" if system_instruction else prompt
    resp = requests.post(
        f"{settings.OLLAMA_BASE_URL}/api/generate",
        json={"model": settings.OLLAMA_MODEL, "prompt": full_prompt, "stream": False},
        timeout=120,
    )
    resp.raise_for_status()
    return resp.json().get("response", "").strip()


def clean_mermaid_mindmap(code: str) -> str:
    if not code:
        return "mindmap\n  root((Chapter Overview))"

    # 1. Remove markdown code fences
    code = re.sub(r"```mermaid", "", code, flags=re.IGNORECASE)
    code = re.sub(r"```", "", code).strip()

    # 2. Strip markdown bold/italic asterisks
    code = re.sub(r"\*", "", code)

    # 3. Clean invalid special characters from node lines
    lines = []
    for line in code.splitlines():
        if line.strip().startswith("mindmap"):
            lines.append("mindmap")
        else:
            cleaned_line = re.sub(r"[:\(\)\[\]\{\}]", "", line)
            lines.append(cleaned_line)
    code = "\n".join(lines)

    # 4. Ensure it starts with 'mindmap'
    if not code.lstrip().startswith("mindmap"):
        code = "mindmap\n" + code

    return code


def generate(prompt: str, system_instruction: str = "") -> str:
    """Tries the configured primary provider, falls back automatically."""
    provider_order = (
        ["gemini", "ollama"] if getattr(settings, "LLM_PROVIDER", "gemini") == "gemini" else ["ollama", "gemini"]
    )
    last_error = None
    for provider in provider_order:
        try:
            if provider == "gemini":
                return _gemini_generate(prompt, system_instruction)
            else:
                return _ollama_generate(prompt, system_instruction)
        except Exception as e:  # noqa: BLE001
            logger.warning(f"[llm_service] {provider} failed: {e}")
            last_error = e
            continue
    raise RuntimeError(f"All LLM providers failed. Last error: {last_error}")


def generate_json(prompt: str, system_instruction: str = "") -> dict:
    """Generate and parse a JSON response, stripping markdown code fences."""
    raw = generate(prompt, system_instruction)
    cleaned = raw.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.strip("`")
        cleaned = cleaned.replace("json\n", "", 1) if cleaned.startswith("json") else cleaned
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        # attempt to salvage the first {...} or [...] block
        match = re.search(r"(\{.*\}|\[.*\])", cleaned, re.DOTALL)
        if match:
            return json.loads(match.group(1))
        raise


# ------------------ RAG-specific prompts ------------------

RAG_SYSTEM_INSTRUCTION = """You are a study assistant for a specific course chapter.
STRICT RULES:
1. Answer ONLY using the CONTEXT provided below, which comes from the student's own uploaded chapter notes.
2. If the answer is not contained in the CONTEXT, say exactly: "{no_answer}" - do not guess, do not use outside knowledge.
3. Keep answers concise, clear, and student-friendly. Use bullet points for lists.
4. If the context includes formulas, preserve them in LaTeX form wrapped in $...$ or $$...$$.
""".format(no_answer=NO_ANSWER_PHRASE)


def answer_from_context(question: str, context_chunks: list) -> dict:
    """Returns (answer, grounded) where grounded=False if the model could not find an answer in context."""
    context_text = "\n\n---\n\n".join(
        f"[Section: {c['heading']}]\n{c['text']}" for c in context_chunks
    )
    prompt = f"CONTEXT:\n{context_text}\n\nSTUDENT QUESTION: {question}\n\nAnswer:"
    answer = generate(prompt, RAG_SYSTEM_INSTRUCTION)
    grounded = NO_ANSWER_PHRASE not in answer
    return {"answer": answer, "grounded": grounded}


QUIZ_SYSTEM_INSTRUCTION = """You are a quiz generator for a course chapter.
Generate multiple-choice questions STRICTLY from the given chapter context.
Return ONLY valid JSON (no markdown fences, no commentary) as an array of objects:
[{"question": "...", "options": ["A", "B", "C", "D"], "correct_index": 0, "topic": "short topic name"}]
Each question must have exactly 4 options and a single correct_index (0-3).
Cover a range of subtopics from the context. Do not invent facts not present in the context.
"""


def generate_quiz(context_text: str, num_questions: int) -> list:
    prompt = f"CHAPTER CONTEXT:\n{context_text[:12000]}\n\nGenerate {num_questions} quiz questions as a JSON array."
    result = generate_json(prompt, QUIZ_SYSTEM_INSTRUCTION)
    if isinstance(result, dict) and "questions" in result:
        result = result["questions"]
    return result


REVISION_SYSTEM_INSTRUCTION = """You produce study revision aids STRICTLY from the given chapter context.
Return ONLY valid JSON (no markdown fences) with this exact shape:
{
  "comparison_table_markdown": "a markdown table comparing key concepts in the chapter (or '' if not applicable)",
  "mnemonics": ["short mnemonic 1", "short mnemonic 2"],
  "mermaid_mindmap": "mindmap\\n  root\\n    Topic 1\\n      Subtopic A\\n    Topic 2"
}

RULES FOR MERMAID MINDMAP:
1. Start directly with the word 'mindmap'.
2. Do NOT use special characters like colons, parentheses, brackets, or asterisks (*, :, (), []) anywhere in node text.
3. Use simple, plain text for node labels with 2-space indentation per depth level.
"""


def generate_revision_aids(context_text: str) -> dict:
    prompt = f"CHAPTER CONTEXT:\n{context_text[:12000]}\n\nGenerate the revision aids JSON."
    res = generate_json(prompt, REVISION_SYSTEM_INSTRUCTION)

    # Sanitize and clean the mindmap output before returning to frontend
    if isinstance(res, dict) and "mermaid_mindmap" in res:
        res["mermaid_mindmap"] = clean_mermaid_mindmap(str(res["mermaid_mindmap"]))

    return res