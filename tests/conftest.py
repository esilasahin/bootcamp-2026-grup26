import os

os.environ["DATABASE_URL"] = "sqlite+pysqlite:///./test_unimate.db"
os.environ["JWT_SECRET_KEY"] = "test-secret-key-that-is-long-enough-for-tests"

import pytest
from fastapi.testclient import TestClient

from app.db.base import Base
from app.db.session import engine
from app.main import app


@pytest.fixture(autouse=True)
def reset_database():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def client():
    with TestClient(app) as test_client:
        yield test_client
