import asyncio
import sys
import os
from sqlalchemy import select
from app.models.user import User
from app.db.engine import AsyncSessionLocal
from app.db.repositories import UserRepo, ApiKeyRepo
from app.utils.hashing import hash_api_key
import secrets

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
async def main():
    if len(sys.argv) < 2:
        print("Usage: python scripts/generate_api_key.py <user_email> [key_name]")
        sys.exit(1)
        
    email = sys.argv[1]
    name = sys.argv[2] if len(sys.argv) > 2 else "CLI Generated Key"
    
    print(f"Generating API key for email: {email}...")
    
    async with AsyncSessionLocal() as session:

        
        result = await session.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()
        
        if not user:
            import uuid
            user_id = uuid.uuid4()
            user = await UserRepo.upsert_from_jwt(session, supabase_uid=user_id, email=email)
            print(f"Created new user {user.id} for {email}")
        else:
            print(f"Found existing user {user.id} for {email}")
            
        raw_key = f"gwy_{secrets.token_urlsafe(32)}"
        key_hash = hash_api_key(raw_key)
        
        api_key = await ApiKeyRepo.create(session, user_id=user.id, key_hash=key_hash, name=name)
        
        await session.commit()
        
        print("\n" + "="*50)
        print("API KEY GENERATED SUCCESSFULLY")
        print("="*50)
        print(f"Key ID:    {api_key.id}")
        print(f"Key Name:  {api_key.name}")
        print(f"Raw Key:   {raw_key}")


if __name__ == "__main__":
    asyncio.run(main())