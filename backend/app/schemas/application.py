import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models.application import ApplicationStatus


class ApplicationCreate(BaseModel):
    job_title: str
    company: str
    job_url: str | None = None
    job_description: str
    tailored_resume: str
    cover_letter: str
    match_score: int = Field(..., ge=0, le=100)


class ApplicationStatusUpdate(BaseModel):
    status: ApplicationStatus


class ApplicationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    job_title: str
    company: str
    job_url: str | None
    job_description: str
    tailored_resume: str
    cover_letter: str
    match_score: int
    status: ApplicationStatus
    created_at: datetime.datetime
    updated_at: datetime.datetime


class ApplicationSummary(BaseModel):
    """Lightweight shape for list views — omits full resume/cover letter text."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    job_title: str
    company: str
    job_url: str | None
    match_score: int
    status: ApplicationStatus
    created_at: datetime.datetime
