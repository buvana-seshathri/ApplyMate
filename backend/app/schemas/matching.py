from pydantic import BaseModel, Field

from app.schemas.discovery import JobPosting


class MatchRequest(BaseModel):
    postings: list[JobPosting] = Field(..., description="Jobs to score, from discovery")
    base_resume: str = Field(..., description="Candidate's base resume, plain text")
    min_score: int = Field(
        default=0, ge=0, le=100, description="Drop results below this score"
    )


class ScoredPosting(BaseModel):
    posting: JobPosting
    score: int = Field(..., ge=0, le=100)
    rationale: str
    matched_skills: list[str] = Field(default_factory=list)
    missing_skills: list[str] = Field(default_factory=list)


class MatchResponse(BaseModel):
    scored: list[ScoredPosting]
    total_scored: int
    total_filtered_out: int
