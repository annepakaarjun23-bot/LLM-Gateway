from sqlalchemy.orm import DeclarativeBase
from sqlalchemy import Column, DateTime
import uuid
from datetime import datetime


class Base(DeclarativeBase):
    pass

class TimestampMixin:
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)