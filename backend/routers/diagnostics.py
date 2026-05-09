from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
import models
import schemas
import auth as auth_utils

router = APIRouter(prefix="/diagnostics", tags=["diagnostics"])


@router.get("/start", response_model=schemas.DiagnosticStepResponse)
def get_first_step(db: Session = Depends(get_db), _: models.User = Depends(auth_utils.get_current_user)):
    step = db.query(models.DiagnosticStep).filter(models.DiagnosticStep.is_root == True).first()
    if not step:
        raise HTTPException(status_code=404, detail="Диагностика не настроена")
    return step


@router.get("/step/{step_id}", response_model=schemas.DiagnosticStepResponse)
def get_step(step_id: int, db: Session = Depends(get_db), _: models.User = Depends(auth_utils.get_current_user)):
    step = db.query(models.DiagnosticStep).filter(models.DiagnosticStep.id == step_id).first()
    if not step:
        raise HTTPException(status_code=404, detail="Шаг не найден")
    return step
