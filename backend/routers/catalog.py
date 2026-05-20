from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from database import get_db
import models
import schemas
import auth as auth_utils

router = APIRouter(prefix="/catalog", tags=["catalog"])


@router.get("", response_model=List[schemas.CatalogPlantBase])
def get_catalog(
    search: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    difficulty: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    _: models.User = Depends(auth_utils.get_current_user),
):
    query = db.query(models.CatalogPlant)
    if category:
        query = query.filter(models.CatalogPlant.category == category)
    if difficulty:
        query = query.filter(models.CatalogPlant.difficulty == difficulty)
    plants = query.order_by(models.CatalogPlant.name).all()
    if search:
        term = search.lower()
        plants = [p for p in plants if term in (p.name or '').lower() or term in (p.latin_name or '').lower()]
    return plants


@router.get("/categories")
def get_categories(db: Session = Depends(get_db), _: models.User = Depends(auth_utils.get_current_user)):
    rows = db.query(models.CatalogPlant.category).distinct().all()
    return [r[0] for r in rows if r[0]]


@router.get("/{plant_id}", response_model=schemas.CatalogPlantBase)
def get_plant(plant_id: int, db: Session = Depends(get_db), _: models.User = Depends(auth_utils.get_current_user)):
    plant = db.query(models.CatalogPlant).filter(models.CatalogPlant.id == plant_id).first()
    if not plant:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Растение не найдено")
    return plant
