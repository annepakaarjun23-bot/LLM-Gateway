from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession
from .engine import AsyncSessionLocal

async def get_db_session() -> AsyncSession:
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()