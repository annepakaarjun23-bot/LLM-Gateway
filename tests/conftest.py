import asyncio
from uuid import uuid4
from datetime import datetime

import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession

from app.main import app
from app.models.base import Base
from app.db.session import get_db_session
from app.auth.api_key_auth import APIKeyIdentity
from app.auth.supabase_jwt import JWTIdentity
from app.utils.hashing import hash_api_key

TEST_DATABASE_URL = "sqlite+aiosqlite:///file::memory:?cache=shared&uri=true"

test_engine = create_async_engine(TEST_DATABASE_URL, echo=False)
TestSessionLocal = async_sessionmaker(test_engine, class_=AsyncSession, expire_on_commit=False)

@pytest_asyncio.fixture(scope="session")
def event_loop():
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()

@pytest_asyncio.fixture(scope="session", autouse=True)
async def setup_database():
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

@pytest_asyncio.fixture
async def db_session():
    async with TestSessionLocal() as session:
        yield session
        await session.rollback() 

@pytest_asyncio.fixture
def override_get_db(db_session):
    async def _override():
        yield db_session
    return _override

@pytest_asyncio.fixture
def mock_jwt_identity():
    return JWTIdentity(user_id=uuid4(), email="testuser@example.com")

@pytest_asyncio.fixture
def mock_api_key_identity():
    return APIKeyIdentity(user_id=uuid4(), api_key_id=uuid4())

@pytest_asyncio.fixture
async def client(override_get_db, mock_jwt_identity, mock_api_key_identity):
    app.dependency_overrides[get_db_session] = override_get_db
    
    async def mock_jwt_dep():
        return mock_jwt_identity
    async def mock_api_key_dep():
        return mock_api_key_identity
        
    from app.routes.admin import get_current_user_by_jwt
    from app.routes.chat import get_current_user_by_api_key
    from app.routes.models_route import get_current_user_by_api_key as models_api_key
    
    app.dependency_overrides[get_current_user_by_jwt] = mock_jwt_dep
    app.dependency_overrides[get_current_user_by_api_key] = mock_api_key_dep
    app.dependency_overrides[models_api_key] = mock_api_key_dep

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as c:
        yield c
        
    app.dependency_overrides.clear()