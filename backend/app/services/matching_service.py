"""
Matching & scoring service.

Scores a list of discovered postings against the candidate's resume using
fast keyword overlap — deliberately NOT calling the local LLM here, since
scoring a full list of postings (often 10-50+ jobs) one-by-one through a
CPU-bound Ollama model would take many minutes and make the discovery ->
matching flow unusable. This tier is meant to cheaply narrow a long list
down to the handful worth a real look; the tailoring endpoint still runs
a full LLM-based match_score once you commit to a specific job.
"""

import re

from app.schemas.discovery import JobPosting
from app.schemas.matching import ScoredPosting

# A reasonably broad set of tech/role keywords to extract from resumes and
# titles. Not exhaustive by design — this is a coarse pre-filter, not a
# replacement for the LLM-based tailoring score.
SKILL_VOCAB = [
    "python", "java", "javascript", "typescript", "react", "angular", "vue",
    "node", "node.js", "fastapi", "flask", "django", "spring", "spring boot",
    "go", "golang", "rust", "c++", "c#", ".net", "sql", "postgresql", "mysql",
    "mongodb", "redis", "kafka", "spark", "hadoop", "airflow", "aws", "gcp",
    "azure", "docker", "kubernetes", "terraform", "ci/cd", "jenkins",
    "machine learning", "deep learning", "ml", "ai", "nlp", "llm", "pytorch",
    "tensorflow", "scikit-learn", "pandas", "numpy", "data engineering",
    "data science", "backend", "frontend", "full stack", "full-stack",
    "devops", "sre", "microservices", "rest api", "graphql", "grpc",
    "distributed systems", "hpc", "computer vision", "cuda", "linux",
    "software engineer", "senior", "staff", "principal", "lead", "manager",
    "internship", "intern", "new grad", "entry level",
]


def _extract_skills(text: str) -> set[str]:
    text_lower = text.lower()
    found = set()
    for skill in SKILL_VOCAB:
        # word-boundary-ish match; skills with symbols (c++, .net) use plain substring
        if re.search(r"[a-z0-9+.#]", skill) and skill in text_lower:
            found.add(skill)
    return found


def score_postings(
    postings: list[JobPosting], base_resume: str, min_score: int = 0
) -> tuple[list[ScoredPosting], int]:
    resume_skills = _extract_skills(base_resume)

    scored: list[ScoredPosting] = []
    filtered_out = 0

    for posting in postings:
        title_text = f"{posting.title} {posting.location or ''}"
        job_skills = _extract_skills(title_text)

        matched = sorted(resume_skills & job_skills)
        missing = sorted(job_skills - resume_skills)

        if job_skills:
            overlap_ratio = len(matched) / len(job_skills)
        else:
            # Title too short/generic to extract keywords from — neutral score
            overlap_ratio = 0.5

        score = round(overlap_ratio * 100)

        if matched:
            rationale = f"Title overlaps on: {', '.join(matched)}."
        elif job_skills:
            rationale = (
                f"No direct keyword overlap with resume "
                f"(job mentions: {', '.join(sorted(job_skills)[:4])})."
            )
        else:
            rationale = "Title too generic to score confidently — worth a manual look."

        if score < min_score:
            filtered_out += 1
            continue

        scored.append(
            ScoredPosting(
                posting=posting,
                score=score,
                rationale=rationale,
                matched_skills=matched,
                missing_skills=missing,
            )
        )

    scored.sort(key=lambda s: s.score, reverse=True)
    return scored, filtered_out
