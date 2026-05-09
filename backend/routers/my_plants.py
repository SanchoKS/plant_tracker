from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date, datetime, timedelta
import os
import uuid
import aiofiles

from database import get_db
import models
import schemas
import auth as auth_utils

router = APIRouter(prefix="/my-plants", tags=["my-plants"])
UPLOAD_DIR = os.path.join(os.environ.get("DATA_DIR", "."), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.get("", response_model=List[schemas.UserPlantResponse])
def get_my_plants(
    current_user: models.User = Depends(auth_utils.get_current_user),
    db: Session = Depends(get_db),
):
    return db.query(models.UserPlant).filter(models.UserPlant.user_id == current_user.id).all()


@router.post("", response_model=schemas.UserPlantResponse)
def add_plant(
    plant_data: schemas.UserPlantCreate,
    current_user: models.User = Depends(auth_utils.get_current_user),
    db: Session = Depends(get_db),
):
    catalog = db.query(models.CatalogPlant).filter(models.CatalogPlant.id == plant_data.catalog_plant_id).first()
    if not catalog:
        raise HTTPException(status_code=404, detail="Растение не найдено в каталоге")

    plant = models.UserPlant(
        user_id=current_user.id,
        catalog_plant_id=plant_data.catalog_plant_id,
        nickname=plant_data.nickname,
        location=plant_data.location,
        added_date=plant_data.added_date or date.today(),
    )
    db.add(plant)
    db.commit()
    db.refresh(plant)
    return plant


@router.get("/{plant_id}", response_model=schemas.UserPlantResponse)
def get_plant(
    plant_id: int,
    current_user: models.User = Depends(auth_utils.get_current_user),
    db: Session = Depends(get_db),
):
    plant = db.query(models.UserPlant).filter(
        models.UserPlant.id == plant_id,
        models.UserPlant.user_id == current_user.id,
    ).first()
    if not plant:
        raise HTTPException(status_code=404, detail="Растение не найдено")
    return plant


@router.patch("/{plant_id}", response_model=schemas.UserPlantResponse)
def update_plant(
    plant_id: int,
    update_data: schemas.UserPlantUpdate,
    current_user: models.User = Depends(auth_utils.get_current_user),
    db: Session = Depends(get_db),
):
    plant = db.query(models.UserPlant).filter(
        models.UserPlant.id == plant_id,
        models.UserPlant.user_id == current_user.id,
    ).first()
    if not plant:
        raise HTTPException(status_code=404, detail="Растение не найдено")

    for field, value in update_data.model_dump(exclude_none=True).items():
        setattr(plant, field, value)
    db.commit()
    db.refresh(plant)
    return plant


@router.delete("/{plant_id}")
def delete_plant(
    plant_id: int,
    current_user: models.User = Depends(auth_utils.get_current_user),
    db: Session = Depends(get_db),
):
    plant = db.query(models.UserPlant).filter(
        models.UserPlant.id == plant_id,
        models.UserPlant.user_id == current_user.id,
    ).first()
    if not plant:
        raise HTTPException(status_code=404, detail="Растение не найдено")
    db.delete(plant)
    db.commit()
    return {"detail": "Растение удалено"}


@router.post("/{plant_id}/photo")
async def upload_photo(
    plant_id: int,
    file: UploadFile = File(...),
    current_user: models.User = Depends(auth_utils.get_current_user),
    db: Session = Depends(get_db),
):
    plant = db.query(models.UserPlant).filter(
        models.UserPlant.id == plant_id,
        models.UserPlant.user_id == current_user.id,
    ).first()
    if not plant:
        raise HTTPException(status_code=404, detail="Растение не найдено")

    ext = os.path.splitext(file.filename)[1] if file.filename else ".jpg"
    filename = f"{uuid.uuid4()}{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)

    async with aiofiles.open(filepath, "wb") as f:
        content = await file.read()
        await f.write(content)

    if plant.photo_path:
        old_file = os.path.join(UPLOAD_DIR, os.path.basename(plant.photo_path))
        if os.path.exists(old_file):
            os.remove(old_file)

    # Store only the URL-relative path so the frontend can load /uploads/filename
    plant.photo_path = f"uploads/{filename}"
    db.commit()
    return {"photo_path": plant.photo_path}


@router.post("/{plant_id}/care", response_model=schemas.UserPlantResponse)
def log_care_action(
    plant_id: int,
    action: schemas.CareAction,
    current_user: models.User = Depends(auth_utils.get_current_user),
    db: Session = Depends(get_db),
):
    plant = db.query(models.UserPlant).filter(
        models.UserPlant.id == plant_id,
        models.UserPlant.user_id == current_user.id,
    ).first()
    if not plant:
        raise HTTPException(status_code=404, detail="Растение не найдено")

    if action.action_type == "inspection":
        raise HTTPException(status_code=400, detail="Осмотр не записывается в журнал")

    today = date.today()

    already_logged = db.query(models.CareLog).filter(
        models.CareLog.user_plant_id == plant_id,
        models.CareLog.action_type == action.action_type,
        models.CareLog.action_date >= datetime.combine(today, datetime.min.time()),
        models.CareLog.action_date < datetime.combine(today + timedelta(days=1), datetime.min.time()),
    ).first()

    if already_logged:
        raise HTTPException(status_code=409, detail="Это действие уже записано сегодня")

    if action.action_type == "watering":
        plant.last_watered = today
    elif action.action_type == "fertilizing":
        plant.last_fertilized = today
    elif action.action_type == "repotting":
        plant.last_repotted = today

    log_entry = models.CareLog(
        user_plant_id=plant_id,
        action_type=action.action_type,
        notes=action.notes,
    )
    db.add(log_entry)
    db.commit()
    db.refresh(plant)
    return plant


@router.get("/{plant_id}/schedule")
def get_care_schedule(
    plant_id: int,
    current_user: models.User = Depends(auth_utils.get_current_user),
    db: Session = Depends(get_db),
):
    plant = db.query(models.UserPlant).filter(
        models.UserPlant.id == plant_id,
        models.UserPlant.user_id == current_user.id,
    ).first()
    if not plant:
        raise HTTPException(status_code=404, detail="Растение не найдено")

    today = date.today()
    cp = plant.catalog_plant

    def next_date(last: Optional[date], interval: int) -> date:
        if last is None:
            return today
        return last + timedelta(days=interval)

    watering_date = next_date(plant.last_watered, cp.watering_interval_days)
    fertilizing_date = next_date(plant.last_fertilized, cp.fertilizing_interval_days)
    repotting_date = next_date(plant.last_repotted, cp.repotting_interval_days)

    return {
        "watering": {"date": watering_date, "overdue": watering_date <= today},
        "fertilizing": {"date": fertilizing_date, "overdue": fertilizing_date <= today},
        "repotting": {"date": repotting_date, "overdue": repotting_date <= today},
    }
