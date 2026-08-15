"""
Resume + cover letter tailoring service.

Runs against a local model via Ollama (http://localhost:11434) instead of a
hosted API — no API key required, everything stays on-machine.

Design constraints (carried over from prior resume-tailoring work):
- Content-depth rewrites, not keyword stuffing/reshuffling.
- Preserve overall resume length — don't let sections balloon.
- Never fabricate metrics, numbers, or achievements not present in the base resume.
- Surface gaps honestly instead of papering over them.
"""

import json
import os

import requests

OLLAMA_HOST = os.environ.get("OLLAMA_HOST", "http://localhost:11434")
OLLAMA_MODEL = os.environ.get("OLLAMA_MODEL", "llama3.1")
# CPU-only local inference for a full resume + cover letter JSON payload can
# easily take several minutes. Default generously; override via .env if needed.
OLLAMA_TIMEOUT_SECONDS = int(os.environ.get("OLLAMA_TIMEOUT_SECONDS", "600"))

SYSTEM_PROMPT = """You are a resume tailoring assistant. Given a base resume and a \
job description, produce a tailored version of the resume plus a short cover letter.

Hard rules:
1. Do NOT invent metrics, numbers, tools, or achievements that are not present or \
   clearly implied in the base resume. If the JD wants something the resume doesn't \
   support, list it under flagged_gaps instead of fabricating it.
2. Rewrite at the content level — reframe existing bullets to foreground relevant \
   experience, don't just reshuffle keywords into the same bullets.
3. Preserve the overall length of the resume (same rough number of bullets per role, \
   similar total line count). Do not pad.
4. Cover letter: 3 short paragraphs max, no generic filler ("I am excited to apply..."), \
   grounded in specific overlaps between the resume and the JD.
5. match_score (0-100) reflects genuine fit given the gaps you found, not optimism.

Respond ONLY with valid JSON matching this exact shape, no markdown fences, no preamble, \
no text before or after the JSON object:
{
  "tailored_resume": string,
  "cover_letter": string,
  "match_score": integer,
  "match_rationale": string,
  "flagged_gaps": [string, ...]
}
"""


def _extract_json(raw_text: str) -> dict:
    """Local models are less reliable than hosted APIs about respecting
    'JSON only' instructions — they sometimes wrap output in prose or
    markdown fences. Strip fences, then find the outermost {...} block."""
    text = raw_text.strip()
    if text.startswith("```"):
        text = text.strip("`")
        if text.startswith("json"):
            text = text[4:]
        text = text.strip()

    start = text.find("{")
    end = text.rfind("}")
    if start == -1 or end == -1 or end < start:
        raise ValueError(f"No JSON object found in model output: {raw_text[:200]!r}")

    return json.loads(text[start : end + 1])


def tailor_application(
    job_title: str,
    company: str,
    job_description: str,
    base_resume: str,
    notes: str | None = None,
) -> dict:
    user_content = f"""Job title: {job_title}
Company: {company}

Job description:
{job_description}

Base resume:
{base_resume}
"""
    if notes:
        user_content += f"\nAdditional instructions: {notes}\n"

    response = requests.post(
        f"{OLLAMA_HOST}/api/chat",
        json={
            "model": OLLAMA_MODEL,
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_content},
            ],
            "format": "json",
            "stream": False,
            "options": {"temperature": 0.3},
        },
        timeout=OLLAMA_TIMEOUT_SECONDS,
    )
    response.raise_for_status()

    raw_text = response.json()["message"]["content"]
    return _extract_json(raw_text)
