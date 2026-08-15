from fastapi import APIRouter, HTTPException

from app.schemas.tailoring import TailorRequest, TailorResponse
from app.services.tailoring_service import tailor_application

router = APIRouter()


@router.post("/generate", response_model=TailorResponse)
def generate_tailored_application(payload: TailorRequest) -> TailorResponse:
    try:
        result = tailor_application(
            job_title=payload.job_title,
            company=payload.company,
            job_description=payload.job_description,
            base_resume=payload.base_resume,
            notes=payload.notes,
        )
    except Exception as exc:  # noqa: BLE001 - surfaced to client for now
        raise HTTPException(status_code=502, detail=f"Tailoring failed: {exc}") from exc

    return TailorResponse(**result)
