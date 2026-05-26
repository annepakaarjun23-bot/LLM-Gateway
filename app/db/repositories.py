from uuid import UUID
from datetime import datetime
from sqlalchemy import select, update, func, desc, Integer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.dialects.postgresql import insert

from app.models.user import User
from app.models.api_key import ApiKey
from app.models.model_route import ModelRoute
from app.models.usage_log import UsageLog

class UserRepo:
    @staticmethod
    async def get_by_id(session: AsyncSession, user_id: UUID) -> User | None:
        result = await session.execute(select(User).where(User.id == user_id))
        return result.scalar_one_or_none()

    @staticmethod
    async def upsert_from_jwt(session: AsyncSession, supabase_uid: UUID, email: str) -> User:
        """
        Inserts new user or updates email on conflict.
        IMPORTANT: created_at is NOT updated on conflict, preserving original join date.
        """
        stmt = insert(User).values(id=supabase_uid, email=email)
        stmt = stmt.on_conflict_do_update(
            index_elements=['id'], 
            set_={'email': stmt.excluded.email}
        )
        await session.execute(stmt)
        await session.flush()
        
        result = await session.execute(select(User).where(User.id == supabase_uid))
        return result.scalar_one()

class ApiKeyRepo:
    @staticmethod
    async def get_by_key_hash(session: AsyncSession, key_hash: str) -> ApiKey | None:
        result = await session.execute(select(ApiKey).where(ApiKey.key_hash == key_hash))
        return result.scalar_one_or_none()

    @staticmethod
    async def create(session: AsyncSession, user_id: UUID, key_hash: str, name: str | None) -> ApiKey:
        api_key = ApiKey(user_id=user_id, key_hash=key_hash, name=name)
        session.add(api_key)
        await session.flush()
        return api_key

    @staticmethod
    async def deactivate(session: AsyncSession, key_id: UUID, user_id: UUID) -> bool:
        stmt = (
            update(ApiKey)
            .where(ApiKey.id == key_id, ApiKey.user_id == user_id)
            .values(is_active=False)
        )
        result = await session.execute(stmt)
        await session.flush()
        return result.rowcount > 0

    @staticmethod
    async def list_by_user(session: AsyncSession, user_id: UUID) -> list[ApiKey]:
        result = await session.execute(
            select(ApiKey)
            .where(ApiKey.user_id == user_id)
            .order_by(desc(ApiKey.created_at))
        )
        return list(result.scalars().all())

    @staticmethod
    async def count_active_by_user(session: AsyncSession, user_id: UUID) -> int:
        result = await session.execute(
            select(func.count(ApiKey.id))
            .where(ApiKey.user_id == user_id, ApiKey.is_active == True)
        )
        return result.scalar_one()

class ModelRouteRepo:
    @staticmethod
    async def get_routes(session: AsyncSession, internal_name: str) -> list[ModelRoute]:
        result = await session.execute(
            select(ModelRoute)
            .where(ModelRoute.internal_name == internal_name, ModelRoute.is_active == True)
            .order_by(ModelRoute.priority.asc())
        )
        return list(result.scalars().all())

    @staticmethod
    async def list_all(session: AsyncSession) -> list[ModelRoute]:
        result = await session.execute(
            select(ModelRoute)
            .where(ModelRoute.is_active == True) 
            .order_by(ModelRoute.internal_name, ModelRoute.priority)
        )
        return list(result.scalars().all())

    @staticmethod
    async def get_all_grouped(session: AsyncSession) -> dict[str, list[ModelRoute]]:
        routes = await ModelRouteRepo.list_all(session)
        grouped = {}
        for route in routes:
            if route.internal_name not in grouped:
                grouped[route.internal_name] = []
            grouped[route.internal_name].append(route)
        return grouped

class UsageLogRepo:
    @staticmethod
    async def insert_log(session: AsyncSession, **kwargs) -> UsageLog:
        kwargs.setdefault("provider", "unknown")
        kwargs.setdefault("model", "unknown")
        kwargs.setdefault("internal_model", "unknown")
        kwargs.setdefault("error_message", None)

        log = UsageLog(**kwargs)
        session.add(log)
        await session.flush()
        
        return log

    @staticmethod
    async def get_by_user(
        session: AsyncSession, 
        user_id: UUID, 
        from_date: datetime | None, 
        to_date: datetime | None, 
        model: str | None,
        page: int, 
        per_page: int
    ) -> tuple[list[UsageLog], int]:
        query = select(UsageLog).where(UsageLog.user_id == user_id)
        count_query = select(func.count(UsageLog.id)).where(UsageLog.user_id == user_id)
        
        if from_date:
            query = query.where(UsageLog.created_at >= from_date)
            count_query = count_query.where(UsageLog.created_at >= from_date)
        if to_date:
            query = query.where(UsageLog.created_at <= to_date)
            count_query = count_query.where(UsageLog.created_at <= to_date)
        if model:
            query = query.where(UsageLog.internal_model == model)
            count_query = count_query.where(UsageLog.internal_model == model)
            
        total_result = await session.execute(count_query)
        total_count = total_result.scalar_one()
        
        result = await session.execute(
            query.order_by(desc(UsageLog.created_at))
            .limit(per_page)
            .offset((page - 1) * per_page)
        )
        logs = list(result.scalars().all())
        return logs, total_count

    @staticmethod
    async def get_aggregates(
        session: AsyncSession, 
        user_id: UUID, 
        from_date: datetime | None, 
        to_date: datetime | None, 
        model: str | None
    ) -> dict:
        query = select(
            func.count(UsageLog.id).label("total_requests"),
            func.coalesce(func.sum(UsageLog.input_tokens), 0).label("total_input_tokens"),
            func.coalesce(func.sum(UsageLog.output_tokens), 0).label("total_output_tokens"),
            func.coalesce(func.sum(UsageLog.cache_hit.cast(Integer)), 0).label("cache_hits"),
            func.coalesce(func.sum(UsageLog.guardrail_blocked.cast(Integer)), 0).label("blocked_requests"),
            func.coalesce(func.avg(UsageLog.gateway_latency_ms), 0).label("avg_latency_ms"),
            func.coalesce(func.avg(UsageLog.provider_latency_ms), 0).label("avg_provider_latency_ms")
        ).where(UsageLog.user_id == user_id)
        
        if from_date:
            query = query.where(UsageLog.created_at >= from_date)
        if to_date:
            query = query.where(UsageLog.created_at <= to_date)
        if model:
            query = query.where(UsageLog.internal_model == model)
            
        result = await session.execute(query)
        row = result.one()
        data = row._asdict()
        data["avg_latency_ms"] = float(data["avg_latency_ms"]) if data["avg_latency_ms"] else 0.0
        data["avg_provider_latency_ms"] = float(data["avg_provider_latency_ms"]) if data["avg_provider_latency_ms"] else 0.0
        return data