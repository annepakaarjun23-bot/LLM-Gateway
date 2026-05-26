from sqlalchemy import Column, Integer, String, Boolean
from .base import Base

class ModelRoute(Base):
    __tablename__ = "model_routes"

    id = Column(Integer, primary_key=True, autoincrement=True)
    internal_name = Column(String, nullable=False)
    provider = Column(String, nullable=False)
    provider_model_id = Column(String, nullable=False)
    endpoint_url = Column(String, nullable=False)
    priority = Column(Integer, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)