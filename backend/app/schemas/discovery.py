from pydantic import BaseModel, Field


class JobPosting(BaseModel):
    source: str = Field(..., description="'greenhouse' or 'lever'")
    company: str
    title: str
    location: str | None = None
    url: str
    posted_at: str | None = None
    job_id: str


class DiscoverRequest(BaseModel):
    boards: list[str] = Field(
        ...,
        description=(
            "Company board tokens to query, e.g. Greenhouse token 'stripe' or "
            "Lever slug 'netflix'. Same list is tried against both providers."
        ),
    )
    keyword: str | None = Field(
        default=None, description="Optional case-insensitive title filter"
    )


class DiscoverResponse(BaseModel):
    postings: list[JobPosting]
    boards_queried: list[str]
    boards_failed: list[str]
