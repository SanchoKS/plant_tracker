from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from database import engine
import models
from routers import auth, catalog, my_plants, care_log, diagnostics
from seed import seed

models.Base.metadata.create_all(bind=engine)
seed()

app = FastAPI(title="Plant Tracker API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = os.path.join(os.environ.get("DATA_DIR", "."), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

app.include_router(auth.router)
app.include_router(catalog.router)
app.include_router(my_plants.router)
app.include_router(care_log.router)
app.include_router(diagnostics.router)


@app.get("/")
def root():
    return {"status": "ok", "message": "Plant Tracker API"}
