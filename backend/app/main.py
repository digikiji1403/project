
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.db.database import Base, engine
from app.db import models  # Registers SQLAlchemy models with Base

from app.api.routes.health import router as health_router
from app.api.routes.stats import router as stats_router
from app.api.routes.auth import router as auth_router
from app.api.routes.tutor import router as tutor_router
from app.api.routes.conversations import router as conversations_router
from app.api.routes.documents import router as documents_router
from app.api.routes.study import router as study_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create missing database tables during application startup.
    # Existing tables and their data are preserved.
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title="StudyMate Backend",
    description="Backend API for the StudyMate AI learning assistant",
    version="0.1.0",
    lifespan=lifespan,
)

# Local development origins are always allowed.
allowed_origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

# Add the deployed frontend URL through the FRONTEND_URL environment variable.
frontend_url = os.getenv("FRONTEND_URL", "").strip().rstrip("/")

if frontend_url:
    allowed_origins.append(frontend_url)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API routes.
app.include_router(documents_router)
app.include_router(study_router)
app.include_router(conversations_router)
app.include_router(tutor_router)
app.include_router(health_router)
app.include_router(stats_router)
app.include_router(auth_router)


@app.get("/")
def root():
    return {
        "message": "Welcome to StudyMate AI API",
        "status": "running",
    }
