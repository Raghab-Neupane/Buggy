from typing import List, Optional
from datetime import datetime, timedelta
from app.repositories.device_repository import DeviceRepository
from app.repositories.log_repository import LogRepository
from app.schemas.device import DeviceResponse, DeviceDetailResponse
from sqlalchemy import select, func
from app.models.log import Log

class DeviceService:
  def __init__(self, device_repo: DeviceRepository, log_repo: LogRepository):
    self.device_repo = device_repo
    self.log_repo = log_repo

  async def get_all_devices(self) -> List[DeviceResponse]:
    devices = await self.device_repo.list_all()
    response_list = []

    for dev in devices:
      # Query log metrics from buggy_logs DB
      log_count = await self.log_repo.count_by_device_id(dev.id)
      
      # Query error count for this device
      error_query = (
        select(func.count(Log.id))
        .where(Log.device_id == dev.id)
        .where(Log.level.ilike("error"))
      )
      error_result = await self.log_repo.db.execute(error_query)
      error_count = error_result.scalar() or 0

      # Determine if online (last seen within 5 minutes)
      online = (datetime.now() - dev.last_seen).total_seconds() < 300

      # Calculate human-friendly last seen
      diff_secs = int((datetime.now() - dev.last_seen).total_seconds())
      last_seen_str = "Just now"
      if diff_secs > 5:
        if diff_secs < 60:
          last_seen_str = f"{diff_secs}s ago"
        elif diff_secs < 3600:
          last_seen_str = f"{diff_secs // 60}m ago"
        else:
          last_seen_str = f"{diff_secs // 3600}h ago"

      response_list.append(
        DeviceResponse(
          id=dev.id,
          deviceName=dev.device_name,
          online=online,
          logCount=log_count,
          errorCount=error_count,
          lastSeen=last_seen_str,
          browser=dev.browser,
          os=dev.os
        )
      )

    return response_list

  async def get_device_by_id(self, device_id: str) -> Optional[DeviceDetailResponse]:
    dev = await self.device_repo.get_by_id(device_id)
    if not dev:
      return None
    return DeviceDetailResponse.model_validate(dev)
