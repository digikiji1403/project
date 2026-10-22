
from contextlib import asynccontextmanager
from pathlib import Path

import pytest
from dotenv import load_dotenv
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

PROJECT_ROOT = Path(__file__).resolve().parents[2]
load_dotenv(PROJECT_ROOT / ".env")

from app.db.database import Base
from app.db.models import User
from app.api.routes.stats import get_db
from app.core.security import get_current_user
from app.main import app


@pytest.fixture
def test_client():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )

    TestingSessionLocal = sessionmaker(
        autocommit=False,
        autoflush=False,
        bind=engine,
    )

    Base.metadata.create_all(bind=engine)

    # Create a user in the isolated test database.
    db = TestingSessionLocal()

    test_user = User(
        email="test@example.com",
        full_name="Test Student",
        hashed_password="test-password-hash",
        is_active=True,
    )

    db.add(test_user)
    db.commit()
    db.refresh(test_user)
    test_user_id = test_user.id
    db.close()

    # Provide a database session to the stats endpoints.
    def override_get_db():
        session = TestingSessionLocal()
        try:
            yield session
        finally:
            session.close()

    # Authenticate requests as the test user.
    def override_get_current_user():
        session = TestingSessionLocal()
        try:
            user = session.query(User).filter(
                User.id == test_user_id
            ).first()

            if user is None:
                raise RuntimeError("Test user was not created.")

            return user
        finally:
            session.close()

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = override_get_current_user

    original_lifespan = app.router.lifespan_context

    @asynccontextmanager
    async def test_lifespan(_app):
        yield

    app.router.lifespan_context = test_lifespan

    try:
        with TestClient(app) as client:
            client.test_session_factory = TestingSessionLocal
            yield client
    finally:
        app.router.lifespan_context = original_lifespan
        app.dependency_overrides.clear()
        Base.metadata.drop_all(bind=engine)
        engine.dispose()
