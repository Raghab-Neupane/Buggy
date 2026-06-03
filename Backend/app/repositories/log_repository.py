from typing import List
from datetime import datetime, time
# pyrefly: ignore [missing-import]
from sqlalchemy import select, func
# pyrefly: ignore [missing-import]
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.log import Log

class LogRepository:
  def __init__(self, db: AsyncSession):
    self.db = db

  async def create(self, log: Log) -> Log:
    self.db.add(log)
    await self.db.flush()
    await self.db.refresh(log)
    return log

  async def list_by_device_id(self, device_id: str, limit: int = 100, offset: int = 0) -> List[Log]:
    query = (
      select(Log)
      .where(Log.device_id == device_id)
      .order_by(Log.timestamp.desc())
      .limit(limit)
      .offset(offset)
    )
    result = await self.db.execute(query)
    return list(result.scalars().all())

  async def count_by_device_id(self, device_id: str) -> int:
    query = select(func.count(Log.id)).where(Log.device_id == device_id)
    result = await self.db.execute(query)
    return result.scalar() or 0

  async def count_errors_today(self) -> int:
    # Start of today (00:00:00)
    today_start = datetime.combine(datetime.now().date(), time.min)
    query = (
      select(func.count(Log.id))
      .where(Log.level.ilike("error"))
      .where(Log.timestamp >= today_start)
    )
    result = await self.db.execute(query)
    return result.scalar() or 0

  async def total_logs_count(self) -> int:
    query = select(func.count(Log.id))
    result = await self.db.execute(query)
    return result.scalar() or 0
