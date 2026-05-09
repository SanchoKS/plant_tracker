from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from datetime import datetime, date, timedelta

from database import get_db
import models
import schemas
import auth as auth_utils

router = APIRouter(prefix="/care-log", tags=["care-log"])


@router.get("", response_model=List[schemas.CareLogResponse])
def get_care_log(
    plant_id: Optional[int] = Query(None),
    action_type: Optional[str] = Query(None),
    days: Optional[int] = Query(None),
    current_user: models.User = Depends(auth_utils.get_current_user),
    db: Session = Depends(get_db),
):
    user_plant_ids = [p.id for p in db.query(models.UserPlant.id).filter(models.UserPlant.user_id == current_user.id).all()]

    query = db.query(models.CareLog).options(
        joinedload(models.CareLog.plant).joinedload(models.UserPlant.catalog_plant)
    ).filter(models.CareLog.user_plant_id.in_(user_plant_ids))

    if plant_id:
        query = query.filter(models.CareLog.user_plant_id == plant_id)
    if action_type:
        query = query.filter(models.CareLog.action_type == action_type)
    if days:
        since = datetime.utcnow() - timedelta(days=days)
        query = query.filter(models.CareLog.action_date >= since)

    logs = query.order_by(models.CareLog.action_date.desc()).all()

    result = []
    for log in logs:
        plant_name = log.plant.catalog_plant.name if log.plant and log.plant.catalog_plant else None
        result.append(schemas.CareLogResponse(
            id=log.id,
            user_plant_id=log.user_plant_id,
            action_type=log.action_type,
            action_date=log.action_date,
            notes=log.notes,
            plant_name=plant_name,
            plant_nickname=log.plant.nickname if log.plant else None,
        ))
    return result


@router.get("/stats")
def get_care_stats(
    current_user: models.User = Depends(auth_utils.get_current_user),
    db: Session = Depends(get_db),
):
    user_plant_ids = [p.id for p in db.query(models.UserPlant.id).filter(models.UserPlant.user_id == current_user.id).all()]

    logs = db.query(models.CareLog).filter(
        models.CareLog.user_plant_id.in_(user_plant_ids),
        models.CareLog.action_type != "inspection",
    ).all()

    stats = {}
    for log in logs:
        stats[log.action_type] = stats.get(log.action_type, 0) + 1

    return {"total": len(logs), "by_action": stats}
