import datetime
import enum

from sqlalchemy import DateTime, Enum, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class ApplicationStatus(str, enum.Enum):
    draft = "draft"
    applied = "applied"
    interviewing = "interviewing"
    rejected = "rejected"
    offer = "offer"


class Application(Base):
    __tablename__ = "applications"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    job_title: Mapped[str] = mapped_column(String(255))
    company: Mapped[str] = mapped_column(String(255))
    job_url: Mapped[str | None] = mapped_column(String(1024), nullable=True)
    job_description: Mapped[str] = mapped_column(Text)
    tailored_resume: Mapped[str] = mapped_column(Text)
    cover_letter: Mapped[str] = mapped_column(Text)
    match_score: Mapped[int] = mapped_column(Integer)
    status: Mapped[ApplicationStatus] = mapped_column(
        Enum(ApplicationStatus), default=ApplicationStatus.draft
    )
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime, default=datetime.datetime.utcnow
    )
    updated_at: Mapped[datetime.datetime] = mapped_column(
        DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow
    )
