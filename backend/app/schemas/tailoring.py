from pydantic import BaseModel, Field


class TailorRequest(BaseModel):
    job_title: str = Field(..., description="Title of the job posting")
    company: str = Field(..., description="Company name")
    job_description: str = Field(..., description="Full text of the job posting")
    base_resume: str = Field(..., description="Candidate's base resume, plain text")
    notes: str | None = Field(
        default=None,
        description="Optional extra instructions, e.g. 'emphasize backend work'",
    )


class TailorResponse(BaseModel):
    tailored_resume: str
    cover_letter: str
    match_score: int = Field(..., ge=0, le=100)
    match_rationale: str
    flagged_gaps: list[str] = Field(
        default_factory=list,
        description="Requirements in the JD the base resume doesn't clearly support",
    )
