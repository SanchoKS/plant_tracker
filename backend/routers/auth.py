from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
import models
import schemas
import auth as auth_utils

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=schemas.Token)
def register(user_data: schemas.UserCreate, db: Session = Depends(get_db)):
    existing = db.query(models.User).filter(models.User.username == user_data.username).first()
    if existing:
        raise HTTPException(status_code=400, detail="Пользователь с таким именем уже существует")

    if len(user_data.password) < 4:
        raise HTTPException(status_code=400, detail="Пароль должен быть не менее 4 символов")

    user = models.User(
        username=user_data.username,
        password_hash=auth_utils.get_password_hash(user_data.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = auth_utils.create_access_token({"sub": user.username})
    return {"access_token": token, "token_type": "bearer", "username": user.username}


@router.post("/login", response_model=schemas.Token)
def login(user_data: schemas.UserLogin, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.username == user_data.username).first()
    if not user or not auth_utils.verify_password(user_data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Неверное имя пользователя или пароль")

    token = auth_utils.create_access_token({"sub": user.username})
    return {"access_token": token, "token_type": "bearer", "username": user.username}


@router.delete("/account")
def delete_account(
    current_user: models.User = Depends(auth_utils.get_current_user),
    db: Session = Depends(get_db),
):
    db.delete(current_user)
    db.commit()
    return {"detail": "Аккаунт удален"}
