from pydantic import BaseModel
from typing import Optional, List
from datetime import date, datetime


class UserCreate(BaseModel):
    username: str
    password: str


class UserLogin(BaseModel):
    username: str
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str
    username: str


class CatalogPlantBase(BaseModel):
    id: int
    name: str
    latin_name: Optional[str] = None
    description: Optional[str] = None
    ideal_light: Optional[str] = None
    ideal_humidity: Optional[str] = None
    ideal_temperature: Optional[str] = None
    watering_interval_days: int
    fertilizing_interval_days: int
    repotting_interval_days: int
    care_notes: Optional[str] = None
    difficulty: Optional[str] = None
    category: Optional[str] = None
    image_url: Optional[str] = None

    class Config:
        from_attributes = True


class UserPlantCreate(BaseModel):
    catalog_plant_id: int
    nickname: str
    location: Optional[str] = None
    added_date: Optional[date] = None


class UserPlantUpdate(BaseModel):
    nickname: Optional[str] = None
    location: Optional[str] = None
    notes: Optional[str] = None


class CareAction(BaseModel):
    action_type: str
    notes: Optional[str] = None


class UserPlantResponse(BaseModel):
    id: int
    catalog_plant_id: int
    nickname: Optional[str] = None
    location: Optional[str] = None
    added_date: Optional[date] = None
    photo_path: Optional[str] = None
    last_watered: Optional[date] = None
    last_fertilized: Optional[date] = None
    last_repotted: Optional[date] = None
    notes: Optional[str] = None
    catalog_plant: CatalogPlantBase

    class Config:
        from_attributes = True


class CareLogResponse(BaseModel):
    id: int
    user_plant_id: int
    action_type: str
    action_date: datetime
    notes: Optional[str] = None
    plant_name: Optional[str] = None
    plant_nickname: Optional[str] = None

    class Config:
        from_attributes = True


class DiagnosticAnswerResponse(BaseModel):
    id: int
    answer_text: str
    next_step_id: Optional[int] = None
    diagnosis: Optional[str] = None
    recommendation: Optional[str] = None

    class Config:
        from_attributes = True


class DiagnosticStepResponse(BaseModel):
    id: int
    question: str
    answers: List[DiagnosticAnswerResponse]

    class Config:
        from_attributes = True
