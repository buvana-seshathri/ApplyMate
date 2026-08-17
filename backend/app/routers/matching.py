from fastapi import APIRouter

from app.schemas.matching import MatchRequest, MatchResponse
from app.services.matching_service import score_postings

router = APIRouter()


@router.post("/score", response_model=MatchResponse)
def score_jobs(payload: MatchRequest) -> MatchResponse:
    scored, filtered_out = score_postings(
        payload.postings, payload.base_resume, payload.min_score
    )
    return MatchResponse(
        scored=scored, total_scored=len(scored), total_filtered_out=filtered_out
    )
