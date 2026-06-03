# pyrefly: ignore [missing-import]
from sqlalchemy import Column, String, DateTime, Text, func
from app.db.database import Base

class Log(Base):
  __tablename__ = "logs"

  id = Column(String(255), primary_key=True, index=True)
  device_id = Column(String(255), nullable=False, index=True)
  level = Column(String(50), nullable=False, index=True)
  message = Column(Text, nullable=False)
  timestamp = Column(DateTime, nullable=True, index=True)
  url = Column(Text, nullable=True)
  stack_trace = Column(Text, nullable=True)
  session_id = Column(String(255), nullable=False)
  created_at = Column(DateTime, default=func.now())
