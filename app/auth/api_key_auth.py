from uuid import UUID
from fastapi import Depends, Header
from sqlalchemy.ext.asyncio import AsyncSession
import logging

from app.db.session import get_db_session
from app.db.repositories import ApiKeyRepo
from app.utils.hashing import hash_api_key
from app.exceptions.auth import AuthenticationError

logger = logging.getLogger(__name__)

API_KEY_PREFIX = "gwy_"

class APIKeyIdentity:
    def __init__(self, user_id: UUID, api_key_id: UUID):
        self.user_id = user_id
        self.api_key_id = api_key_id

async def get_current_user_by_api_key(
    authorization: str = Header(..., alias="Authorization"),
    db: AsyncSession = Depends(get_db_session)
) -> APIKeyIdentity:
    if not authorization.startswith("Bearer "):
        raise AuthenticationError(detail="Invalid authorization header format. Expected: Bearer <token>")

    raw_key = authorization[7:] # Strip "Bearer "

    if not raw_key.startswith(API_KEY_PREFIX):
        raise AuthenticationError(detail="Invalid API key format.")

    key_hash = hash_api_key(raw_key)
    logger.info(f"Looking up API key with hash: {key_hash[:16]}...")

    api_key_record = await ApiKeyRepo.get_by_key_hash(db, key_hash)

    if not api_key_record:
        logger.warning(f"API key not found for hash: {key_hash[:16]}...")
        raise AuthenticationError(detail="Invalid API key.")

    logger.info(f"API key found for user: {api_key_record.user_id}")

    if not api_key_record.is_active:
        raise AuthenticationError(detail="API key has been deactivated.")

    return APIKeyIdentity(
        user_id=api_key_record.user_id,
        api_key_id=api_key_record.id
    )