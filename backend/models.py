from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, Boolean, Date
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    plants = relationship("UserPlant", back_populates="owner", cascade="all, delete-orphan")


class CatalogPlant(Base):
    __tablename__ = "catalog_plants"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)
    latin_name = Column(String)
    description = Column(Text)
    ideal_light = Column(String)
    ideal_humidity = Column(String)
    ideal_temperature = Column(String)
    watering_interval_days = Column(Integer, default=7)
    fertilizing_interval_days = Column(Integer, default=30)
    repotting_interval_days = Column(Integer, default=365)
    care_notes = Column(Text)
    difficulty = Column(String, default="Средняя")
    category = Column(String, default="Другое")
    image_url = Column(String)

    user_plants = relationship("UserPlant", back_populates="catalog_plant")


class UserPlant(Base):
    __tablename__ = "user_plants"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    catalog_plant_id = Column(Integer, ForeignKey("catalog_plants.id"), nullable=False)
    nickname = Column(String)
    location = Column(String)
    added_date = Column(Date, default=datetime.utcnow)
    photo_path = Column(String)
    last_watered = Column(Date)
    last_fertilized = Column(Date)
    last_repotted = Column(Date)
    notes = Column(Text)

    owner = relationship("User", back_populates="plants")
    catalog_plant = relationship("CatalogPlant", back_populates="user_plants")
    care_logs = relationship("CareLog", back_populates="plant", cascade="all, delete-orphan")


class CareLog(Base):
    __tablename__ = "care_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_plant_id = Column(Integer, ForeignKey("user_plants.id"), nullable=False)
    action_type = Column(String, nullable=False)
    action_date = Column(DateTime, default=datetime.utcnow)
    notes = Column(Text)

    plant = relationship("UserPlant", back_populates="care_logs")


class DiagnosticStep(Base):
    __tablename__ = "diagnostic_steps"

    id = Column(Integer, primary_key=True, index=True)
    question = Column(Text, nullable=False)
    is_root = Column(Boolean, default=False)

    answers = relationship("DiagnosticAnswer", back_populates="step", foreign_keys="DiagnosticAnswer.step_id")


class DiagnosticAnswer(Base):
    __tablename__ = "diagnostic_answers"

    id = Column(Integer, primary_key=True, index=True)
    step_id = Column(Integer, ForeignKey("diagnostic_steps.id"), nullable=False)
    answer_text = Column(String, nullable=False)
    next_step_id = Column(Integer, ForeignKey("diagnostic_steps.id"), nullable=True)
    diagnosis = Column(Text, nullable=True)
    recommendation = Column(Text, nullable=True)

    step = relationship("DiagnosticStep", back_populates="answers", foreign_keys=[step_id])
    next_step = relationship("DiagnosticStep", foreign_keys=[next_step_id])
