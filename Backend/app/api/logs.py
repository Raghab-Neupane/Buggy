from fastapi import APIRouter, Depends, Query, HTTPException
# pyrefly: ignore [missing-import]
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Union
from app.db.database import get_core_db, get_logs_db
from app.repositories.device_repository import DeviceRepository
from app.repositories.log_repository import LogRepository
from app.services.log_service import LogService
from app.schemas.log import LogEventSchema, LogResponse

router = APIRouter(tags=["logs"])

@router.post("/logs")
async def ingest_logs(
  payload: Union[LogEventSchema, List[LogEventSchema]],
  core_db: AsyncSession = Depends(get_core_db),
  logs_db: AsyncSession = Depends(get_logs_db)
):
  device_repo = DeviceRepository(core_db)
  log_repo = LogRepository(logs_db)
  service = LogService(device_repo, log_repo)

  # Normalize single log payload to array
  events = payload if isinstance(payload, list) else [payload]
  await service.ingest_logs(events)
  
  # Commit transactions to persist registered devices and telemetry logs
  await core_db.commit()
  await logs_db.commit()
  
  return {"status": "Success"}

@router.get("/devices/{device_id}/logs", response_model=List[LogResponse])
async def get_device_logs(
  device_id: str,
  limit: int = Query(100, ge=1, le=1000),
  offset: int = Query(0, ge=0),
  core_db: AsyncSession = Depends(get_core_db),
  logs_db: AsyncSession = Depends(get_logs_db)
):
  device = await DeviceRepository(core_db).get_by_id(device_id)
  if not device:
      raise HTTPException(status_code=404, detail="Device not found")
  
  device_repo = DeviceRepository(core_db)
  log_repo = LogRepository(logs_db)
  service = LogService(device_repo, log_repo)
  return await service.get_device_logs(device_id, limit, offset)
