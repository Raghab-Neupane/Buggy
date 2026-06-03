from typing import List, Union
from datetime import datetime
import uuid
from app.repositories.device_repository import DeviceRepository
from app.repositories.log_repository import LogRepository
from app.schemas.log import LogEventSchema, LogResponse
from app.models.device import Device
from app.models.log import Log
from app.services.location import resolve_location
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

class LogService:
  def __init__(self, device_repo: DeviceRepository, log_repo: LogRepository):
    self.device_repo = device_repo
    self.log_repo = log_repo

  async def ingest_logs(self, events: List[LogEventSchema], client_ip: str) -> List[LogResponse]:
    inserted_logs = []
    
    # Cache resolved locations and devices for batch inputs
    location_data = None
    device_cache = {}

    for event in events:
      session_id = event.sessionId
      
      # 1. Fetch or create device
      if session_id not in device_cache:
        device = await self.device_repo.get_by_session_id(session_id)
        if not device:
          # Resolve GeoIP location
          if not location_data:
            location_data = await resolve_location(client_ip)
          
          # Parse User Agent
          browser, os = parse_user_agent(event.userAgent)
          
          # Auto-assign device name
          device_name = f"{os} Client"
          if os == "macOS":
            device_name = "MacBook Pro"
          elif os == "Windows":
            device_name = "Windows Desktop"
          elif os == "iOS":
            device_name = "iPhone"
          elif os == "Android":
            device_name = "Android Device"

          # Create device registry row
          new_device = Device(
            id=str(uuid.uuid4()), # Generate primary key
            device_name=device_name,
            session_id=session_id,
            ip=client_ip,
            country=location_data.get("country", "unknown"),
            city=location_data.get("city", "unknown"),
            region=location_data.get("region", "unknown"),
            latitude=location_data.get("latitude"),
            longitude=location_data.get("longitude"),
            sdk_version=event.sdkVersion,
            app_version=event.appVersion,
            browser=browser,
            os=os,
            user_agent=event.userAgent
          )
          device = await self.device_repo.create(new_device)
        else:
          # Device exists, update last seen timestamp
          await self.device_repo.update_last_seen(device.id)
        
        device_cache[session_id] = device

      device = device_cache[session_id]

      # 2. Insert Log
      # Parse timestamp
      try:
        log_timestamp = datetime.fromisoformat(event.timestamp.replace("Z", "+00:00"))
      except ValueError:
        log_timestamp = datetime.now()

      db_log = Log(
        id=event.id,
        device_id=device.id,
        level=event.level,
        message=event.message,
        timestamp=log_timestamp,
        url=event.url,
        stack_trace=event.stackTrace,
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
        sessionId=saved_log.session_id,
        created_at=saved_log.created_at or datetime.now()
      )
      inserted_logs.append(log_res)

      # 3. Broadcast to connected WS clients for this device
      await websocket_manager.broadcast_log(device.id, log_res)

    return inserted_logs

  async def get_device_logs(self, device_id: str, limit: int = 100, offset: int = 0) -> List[LogResponse]:
    logs = await self.log_repo.list_by_device_id(device_id, limit, offset)
    return [
      LogResponse(
        id=l.id,
        deviceId=l.device_id,
        level=l.level,
        message=l.message,
        timestamp=l.timestamp,
        url=l.url,
        stackTrace=l.stack_trace,
        sessionId=l.session_id,
        created_at=l.created_at or datetime.now()
      )
      for l in logs
    ]
