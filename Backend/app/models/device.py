# pyrefly: ignore [missing-import]
from sqlalchemy import Column, String, Float, DateTime, Text, func
from app.db.database import Base

class Device(Base):
  __tablename__ = "devices"

  id = Column(String(255), primary_key=True, index=True)
  device_name = Column(String(255), nullable=False)
  session_id = Column(String(255), nullable=False, unique=True, index=True)
  ip = Column(String(45), nullable=True)
  country = Column(String(100), nullable=True)
  city = Column(String(100), nullable=True)
  region = Column(String(100), nullable=True)
  latitude = Column(Float, nullable=True)
  longitude = Column(Float, nullable=True)
  sdk_version = Column(String(50), nullable=True)
  app_version = Column(String(50), nullable=True)
  browser = Column(String(100), nullable=True)
  os = Column(String(100), nullable=True)
  user_agent = Column(Text, nullable=True)
  created_at = Column(DateTime, default=func.now())
  last_seen = Column(DateTime, default=func.now(), onupdate=func.now(), index=True)
