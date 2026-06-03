from fastapi import APIRouter, Depends
# pyrefly: ignore [missing-import]
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.database import get_core_db, get_logs_db
from app.repositories.device_repository import DeviceRepository
from app.repositories.log_repository import LogRepository
from app.services.stats_service import StatsService
from app.schemas.stats import StatsResponse

router = APIRouter(prefix="/stats", tags=["stats"])

@router.get("", response_model=StatsResponse)
async def get_stats(
  core_db: AsyncSession = Depends(get_core_db),
  logs_db: AsyncSession = Depends(get_logs_db)
):
  device_repo = DeviceRepository(core_db)
  log_repo = LogRepository(logs_db)
  service = StatsService(device_repo, log_repo)
  return await service.get_dashboard_stats()
