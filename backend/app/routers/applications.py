from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import desc
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.application import Application
from app.schemas.application import (
    ApplicationCreate,
    ApplicationOut,
    ApplicationStatusUpdate,
    ApplicationSummary,
)

router = APIRouter()


@router.post("", response_model=ApplicationOut)
def create_application(
    payload: ApplicationCreate, db: Session = Depends(get_db)
) -> Application:
    app_row = Application(**payload.model_dump())
    db.add(app_row)
    db.commit()
    db.refresh(app_row)
    return app_row


@router.get("", response_model=list[ApplicationSummary])
def list_applications(db: Session = Depends(get_db)) -> list[Application]:
    return db.query(Application).order_by(desc(Application.created_at)).all()


@router.get("/{application_id}", response_model=ApplicationOut)
def get_application(application_id: int, db: Session = Depends(get_db)) -> Application:
    app_row = db.get(Application, application_id)
    if not app_row:
        raise HTTPException(status_code=404, detail="Application not found")
    return app_row


@router.patch("/{application_id}/status", response_model=ApplicationOut)
def update_status(
    application_id: int, payload: ApplicationStatusUpdate, db: Session = Depends(get_db)
) -> Application:
    app_row = db.get(Application, application_id)
    if not app_row:
        raise HTTPException(status_code=404, detail="Application not found")
    app_row.status = payload.status
    db.commit()
    db.refresh(app_row)
    return app_row


@router.delete("/{application_id}")
def delete_application(application_id: int, db: Session = Depends(get_db)) -> dict:
    app_row = db.get(Application, application_id)
    if not app_row:
        raise HTTPException(status_code=404, detail="Application not found")
    db.delete(app_row)
    db.commit()
    return {"deleted": application_id}
