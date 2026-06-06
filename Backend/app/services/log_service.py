from typing import List
from datetime import datetime, timezone
from app.repositories.device_repository import DeviceRepository
from app.repositories.log_repository import LogRepository
from app.schemas.log import LogEventSchema, LogResponse
from app.models.device import Device
from app.models.log import Log
from app.websocket.manager import websocket_manager

def parse_user_agent(ua: str) -> tuple[str, str]:
  ua_lower = ua.lower()
  os = "Unknown OS"
  browser = "Unknown Browser"

  if "windows" in ua_lower:
    os = "Windows"
  elif "macintosh" in ua_lower or "mac os x" in ua_lower:
    os = "macOS"
  elif "iphone" in ua_lower or "ipad" in ua_lower:
    os = "iOS"
  elif "android" in ua_lower:
    os = "Android"
  elif "linux" in ua_lower:
    os = "Linux"

  if "edg/" in ua_lower:
    browser = "Edge"
  elif "chrome" in ua_lower:
    browser = "Chrome"
  elif "safari" in ua_lower:
    browser = "Safari"
  elif "firefox" in ua_lower:
    browser = "Firefox"

  return browser, os

def utc_now_naive() -> datetime:
  return datetime.now(timezone.utc).replace(tzinfo=None)

def parse_log_timestamp(timestamp: str) -> datetime:
  try:
    parsed = datetime.fromisoformat(timestamp.replace("Z", "+00:00"))
  except ValueError:
    return utc_now_naive()

  if parsed.tzinfo is None:
    return parsed

  return parsed.astimezone(timezone.utc).replace(tzinfo=None)

class LogService:
  def __init__(self, device_repo: DeviceRepository, log_repo: LogRepository):
    self.device_repo = device_repo
    self.log_repo = log_repo

  async def ingest_logs(self, events: List[LogEventSchema]) -> List[LogResponse]:
    inserted_logs = []
    device_cache = {}

    for event in events:
      device_id = event.deviceId
      session_id = event.sessionId
      session_started_at = None
      if event.sessionStartedAt:
        try:
          session_started_at = datetime.fromisoformat(event.sessionStartedAt.replace("Z", "+00:00")).astimezone(timezone.utc).replace(tzinfo=None)
        except ValueError:
          pass

      # 1. Fetch or create device
      if device_id not in device_cache:
        device = await self.device_repo.get_by_id(device_id)
        if not device:
          new_device = Device(
            id=device_id,
            device_name=event.deviceName or f"{event.os or 'Unknown'} Client",
            session_id=session_id,
            session_started_at=session_started_at,
            browser=event.browser,
            browser_version=event.browserVersion,
            os=event.os,
            latitude=event.latitude,
            longitude=event.longitude
          )
          device = await self.device_repo.create(new_device)
        else:
          # Device exists, check if details changed and update
          if (device.session_id != session_id or
              device.session_started_at != session_started_at or
              device.device_name != event.deviceName or
              device.browser != event.browser or
              device.browser_version != event.browserVersion or
              device.os != event.os or
              device.latitude != event.latitude or
              device.longitude != event.longitude):
            await self.device_repo.update_metadata(
              device.id,
              session_id=session_id,
              session_started_at=session_started_at,
              device_name=event.deviceName,
              browser=event.browser,
              browser_version=event.browserVersion,
              os=event.os,
              latitude=event.latitude,
              longitude=event.longitude
            )
            device = await self.device_repo.get_by_id(device_id)
          else:
            await self.device_repo.update_last_seen(device.id)
        
        device_cache[device_id] = device

      device = device_cache[device_id]

      # 2. Insert Log
      log_timestamp = parse_log_timestamp(event.timestamp)
      import uuid
      log_id = str(uuid.uuid4())

      db_log = Log(
        id=log_id,
        device_id=device.id,
        level=event.level,
        message=event.message,
        timestamp=log_timestamp,
        url=event.url,
        session_id=session_id
      )
      
      saved_log = await self.log_repo.create(db_log)
      
      # Prepare response model
      log_res = LogResponse(
        id=saved_log.id,
        deviceId=saved_log.device_id,
        level=saved_log.level,
        message=saved_log.message,
        timestamp=saved_log.timestamp,
        url=saved_log.url,
        stackTrace=saved_log.stack_trace,
        deviceid=saved_log.session_id,
        created_at=saved_log.created_at or utc_now_naive(),
        location=device.location,
        browser=device.browser,
        browserVersion=device.browser_version,
        deviceName=device.device_name,
        os=device.os,
        latitude=device.latitude,
        longitude=device.longitude,
        sessionStartedAt=device.session_started_at
      )
      inserted_logs.append(log_res)

      # 3. Broadcast to connected WS clients for this device
      await websocket_manager.broadcast_log(device.id, log_res)

    return inserted_logs

  async def get_device_logs(self, device_id: str, limit: int = 100, offset: int = 0) -> List[LogResponse]:
    logs = await self.log_repo.list_by_device_id(device_id, limit, offset)
    device = await self.device_repo.get_by_id(device_id)
    device_location = device.location if device else None
    browser = device.browser if device else None
    browser_version = device.browser_version if device else None
    device_name = device.device_name if device else None
    os = device.os if device else None
    latitude = device.latitude if device else None
    longitude = device.longitude if device else None
    session_started_at = device.session_started_at if device else None

    return [
      LogResponse(
        id=l.id,
        deviceId=l.device_id,
        level=l.level,
        message=l.message,
        timestamp=l.timestamp,
        url=l.url,
        stackTrace=l.stack_trace,
        deviceid=l.session_id,
        created_at=l.created_at or utc_now_naive(),
        location=device_location,
        browser=browser,
        browserVersion=browser_version,
        deviceName=device_name,
        os=os,
        latitude=latitude,
        longitude=longitude,
        sessionStartedAt=session_started_at
      )
      for l in logs
    ]
