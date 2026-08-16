"""
Job discovery service.

Pulls live postings from public, key-free job board APIs:
  - Greenhouse:  https://boards-api.greenhouse.io/v1/boards/{token}/jobs
  - Lever:       https://api.lever.co/v0/postings/{slug}?mode=json

These are the ATS platforms many companies publish their own job boards on,
and both expose read-only JSON endpoints intended for public consumption —
unlike LinkedIn/Indeed, which prohibit scraping in their ToS. A given
"board" string is tried against both providers since callers may not know
which ATS a company uses.
"""

import requests

from app.schemas.discovery import JobPosting

GREENHOUSE_URL = "https://boards-api.greenhouse.io/v1/boards/{token}/jobs"
LEVER_URL = "https://api.lever.co/v0/postings/{slug}?mode=json"

REQUEST_TIMEOUT = 10


def _fetch_greenhouse(token: str) -> list[JobPosting]:
    resp = requests.get(GREENHOUSE_URL.format(token=token), timeout=REQUEST_TIMEOUT)
    resp.raise_for_status()
    data = resp.json()

    postings = []
    for job in data.get("jobs", []):
        postings.append(
            JobPosting(
                source="greenhouse",
                company=token,
                title=job.get("title", ""),
                location=(job.get("location") or {}).get("name"),
                url=job.get("absolute_url", ""),
                posted_at=job.get("updated_at"),
                job_id=str(job.get("id", "")),
            )
        )
    return postings


def _fetch_lever(slug: str) -> list[JobPosting]:
    resp = requests.get(LEVER_URL.format(slug=slug), timeout=REQUEST_TIMEOUT)
    resp.raise_for_status()
    data = resp.json()

    postings = []
    for job in data:
        categories = job.get("categories", {}) or {}
        postings.append(
            JobPosting(
                source="lever",
                company=slug,
                title=job.get("text", ""),
                location=categories.get("location"),
                url=job.get("hostedUrl", ""),
                posted_at=None,
                job_id=str(job.get("id", "")),
            )
        )
    return postings


def discover_jobs(
    boards: list[str], keyword: str | None = None
) -> tuple[list[JobPosting], list[str], list[str]]:
    all_postings: list[JobPosting] = []
    failed: list[str] = []

    for board in boards:
        board = board.strip()
        if not board:
            continue

        found_any = False
        for fetch_fn in (_fetch_greenhouse, _fetch_lever):
            try:
                results = fetch_fn(board)
                if results:
                    all_postings.extend(results)
                    found_any = True
            except requests.RequestException:
                continue

        if not found_any:
            failed.append(board)

    if keyword:
        keyword_lower = keyword.lower()
        all_postings = [p for p in all_postings if keyword_lower in p.title.lower()]

    return all_postings, boards, failed
