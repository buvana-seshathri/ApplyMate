from fastapi import APIRouter

from app.schemas.discovery import DiscoverRequest, DiscoverResponse
from app.services.discovery_service import discover_jobs

router = APIRouter()


@router.post("/search", response_model=DiscoverResponse)
def search_jobs(payload: DiscoverRequest) -> DiscoverResponse:
    postings, queried, failed = discover_jobs(payload.boards, payload.keyword)
    return DiscoverResponse(
        postings=postings, boards_queried=queried, boards_failed=failed
    )
