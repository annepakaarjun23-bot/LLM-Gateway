import time
import json
from uuid import UUID
from datetime import datetime
from fastapi import Depends, Header
from sqlalchemy.ext.asyncio import AsyncSession
import httpx
import jwt

from app.db.session import get_db_session
from app.db.repositories import UserRepo
from app.exceptions.auth import AuthenticationError
from config.settings import settings

class JWTIdentity:
    """Identity object attached to the request when authenticated via Supabase JWT."""
    def __init__(self, user_id: UUID, email: str):
        self.user_id = user_id
        self.email = email

_jwks_cache = None
_jwks_timestamp = 0
JWKS_CACHE_TTL = 3600 

async def _fetch_jwks() -> dict:

    global _jwks_cache, _jwks_timestamp
    
    current_time = time.time()
    
    if _jwks_cache and (current_time - _jwks_timestamp) < JWKS_CACHE_TTL:
        return _jwks_cache

    if not settings.SUPABASE_ANON_KEY:
        raise AuthenticationError(detail="Supabase anon key is required to fetch JWKS.")

    base_url = settings.SUPABASE_URL.rstrip('/')
    if base_url.endswith('/auth/v1'):
        base_url = base_url[: -len('/auth/v1')]

    candidate_paths = [
        '/auth/v1/.well-known/jwks.json',
        '/auth/v1/certs',
        '/.well-known/jwks.json',
    ]
    last_error = None
    headers = {'apikey': settings.SUPABASE_ANON_KEY}

    async with httpx.AsyncClient() as client:
        for path in candidate_paths:
            jwks_url = f"{base_url}{path}"
            try:
                response = await client.get(jwks_url, headers=headers)
                response.raise_for_status()
                jwks = response.json()
                if jwks.get('keys'):
                    _jwks_cache = jwks
                    _jwks_timestamp = current_time
                    return _jwks_cache
                last_error = f"JWKS response from {jwks_url} did not contain keys."
            except httpx.HTTPError as e:
                last_error = str(e)

    if _jwks_cache:
        return _jwks_cache

    raise AuthenticationError(detail=f"Failed to fetch auth keys: {last_error}")

async def _verify_jwt(token: str) -> dict:

    try:
        unverified_header = jwt.get_unverified_header(token)
    except jwt.DecodeError:
        raise AuthenticationError(detail="Invalid JWT format.")

    kid = unverified_header.get("kid")
    if not kid:
        raise AuthenticationError(detail="JWT missing 'kid' header.")

    alg = unverified_header.get("alg")
    if alg not in {"RS256", "ES256"}:
        raise AuthenticationError(detail=f"Unsupported JWT alg: {alg}")

    jwks = await _fetch_jwks()
    
    key_data = None
    for key in jwks.get("keys", []):
        if key.get("kid") == kid:
            key_data = key
            break
            
    if not key_data:
        global _jwks_timestamp
        _jwks_timestamp = 0 # Force cache expiry
        jwks = await _fetch_jwks()
        for key in jwks.get("keys", []):
            if key.get("kid") == kid:
                key_data = key
                break
                
    if not key_data:
        raise AuthenticationError(detail="Unable to find matching signing key for JWT.")

    try:
        public_key = jwt.algorithms.get_default_algorithms()[alg].from_jwk(json.dumps(key_data))
    except Exception as e:
        raise AuthenticationError(detail=f"Unable to construct public key from JWKS: {str(e)}")

    try:
        payload = jwt.decode(
            token,
            public_key,
            algorithms=[alg],
            audience="authenticated",
            issuer=f"{settings.SUPABASE_URL.rstrip('/')}/auth/v1"
        )
        return payload
    except jwt.ExpiredSignatureError:
        raise AuthenticationError(detail="JWT has expired.")
    except jwt.InvalidAudienceError:
        raise AuthenticationError(detail="Invalid JWT audience.")
    except jwt.InvalidIssuerError:
        raise AuthenticationError(detail="Invalid JWT issuer.")
    except jwt.PyJWTError as e:
        raise AuthenticationError(detail=f"JWT validation failed: {str(e)}")


async def get_current_user_by_jwt(
    authorization: str = Header(..., alias="Authorization"),
    db: AsyncSession = Depends(get_db_session)
) -> JWTIdentity:

    if not authorization.startswith("Bearer "):
        raise AuthenticationError(detail="Invalid authorization header format. Expected: Bearer <token>")
    
    token = authorization[7:]
    
    payload = await _verify_jwt(token)
    
    sub = payload.get("sub")
    email = payload.get("email")
    
    if not sub or not email:
        raise AuthenticationError(detail="JWT missing 'sub' or 'email' claims.")
        
    try:
        user_id = UUID(sub)
    except ValueError:
        raise AuthenticationError(detail="Invalid 'sub' claim format in JWT. Expected UUID.")

    user = await UserRepo.upsert_from_jwt(db, supabase_uid=user_id, email=email)
    
    return JWTIdentity(user_id=user.id, email=user.email)