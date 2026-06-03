from fastapi import APIRouter, Depends, HTTPException
# pyrefly: ignore [missing-import]
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from app.db.database import get_core_db, get_logs_db
from app.repositories.device_repository import DeviceRepository
from app.repositories.log_repository import LogRepository
from app.services.device_service import DeviceService
from app.schemas.device import DeviceResponse, DeviceDetailResponse

router = APIRouter(prefix="/devices", tags=["devices"])

@router.get("", response_model=List[DeviceResponse])
async def get_devices(
  core_db: AsyncSession = Depends(get_core_db),
  logs_db: AsyncSession = Depends(get_logs_db)
):
  device_repo = DeviceRepository(core_db)
  log_repo = LogRepository(logs_db)
  service = DeviceService(device_repo, log_repo)
  return await service.get_all_devices()

@router.get("/{device_id}", response_model=DeviceDetailResponse)
async def get_device(
  device_id: str,
  core_db: AsyncSession = Depends(get_core_db),
  logs_db: AsyncSession = Depends(get_logs_db)
):
  device_repo = DeviceRepository(core_db)
  log_repo = LogRepository(logs_db)
  service = DeviceService(device_repo, log_repo)
  
  device_details = await service.get_device_by_id(device_id)
  if not device_details:
    raise HTTPException(status_code=404, detail="Device not found")
  return device_details
