from typing import Any, Dict, List, Optional
from datetime import datetime, timedelta
# pyrefly: ignore [missing-import]
from sqlalchemy import select, func, update
# pyrefly: ignore [missing-import]
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.device import Device

class DeviceRepository:
  def __init__(self, db: AsyncSession):
    self.db = db

  async def get_by_id(self, device_id: str) -> Optional[Device]:
    query = select(Device).where(Device.id == device_id)
    result = await self.db.execute(query)
    return result.scalar_one_or_none()

  async def get_by_session_id(self, session_id: str) -> Optional[Device]:
    query = select(Device).where(Device.session_id == session_id)
    result = await self.db.execute(query)
    return result.scalar_one_or_none()

  async def create(self, device: Device) -> Device:
    self.db.add(device)
    await self.db.flush() # Flushes changes to get timestamps but does not commit
    await self.db.refresh(device)
    return device

  async def update_last_seen(self, device_id: str) -> None:
    query = (
      update(Device)
      .where(Device.id == device_id)
      .values(last_seen=func.now())
    )
    await self.db.execute(query)

  async def update_metadata(
    self,
    device_id: str,
    *,
    session_id: str,
    session_started_at: Optional[datetime],
    device_name: Optional[str],
    browser: str,
    browser_version: Optional[str],
    os: Optional[str],
    latitude: Optional[float],
    longitude: Optional[float]
  ) -> None:
    query = (
      update(Device)
      .where(Device.id == device_id)
      .values(
        session_id=session_id,
        session_started_at=session_started_at,
        device_name=device_name,
        browser=browser,
        browser_version=browser_version,
        os=os,
        latitude=latitude,
        longitude=longitude,
        last_seen=func.now()
      )
    )
    await self.db.execute(query)

  async def list_all(self) -> List[Device]:
    query = select(Device).order_by(Device.last_seen.desc())
    result = await self.db.execute(query)
    return list(result.scalars().all())

  async def count_total(self) -> int:
    query = select(func.count(Device.id))
    result = await self.db.execute(query)
    return result.scalar() or 0

  async def count_online(self, minutes_threshold: int = 5) -> int:
    threshold = datetime.now() - timedelta(minutes=minutes_threshold)
    query = select(func.count(Device.id)).where(Device.last_seen >= threshold)
    result = await self.db.execute(query)
    return result.scalar() or 0
