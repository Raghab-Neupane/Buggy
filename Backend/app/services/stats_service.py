from app.repositories.device_repository import DeviceRepository
from app.repositories.log_repository import LogRepository
from app.schemas.stats import StatsResponse

class StatsService:
  def __init__(self, device_repo: DeviceRepository, log_repo: LogRepository):
    self.device_repo = device_repo
    self.log_repo = log_repo

  async def get_dashboard_stats(self) -> StatsResponse:
    total_devices = await self.device_repo.count_total()
    online_devices = await self.device_repo.count_online(minutes_threshold=5)
    total_logs = await self.log_repo.total_logs_count()
    errors_today = await self.log_repo.count_errors_today()

    return StatsResponse(
      totalDevices=total_devices,
      onlineDevices=online_devices,
      totalLogs=total_logs,
      errorsToday=errors_today
    )
