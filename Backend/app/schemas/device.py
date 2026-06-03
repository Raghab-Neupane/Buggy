from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional

class DeviceBase(BaseModel):
  device_name: str = Field(..., serialization_alias="deviceName", validation_alias="deviceName")
  session_id: str = Field(..., serialization_alias="sessionId", validation_alias="sessionId")
  ip: Optional[str] = None
  country: Optional[str] = None
  city: Optional[str] = None
  region: Optional[str] = None
  latitude: Optional[float] = None
  longitude: Optional[float] = None
  sdk_version: Optional[str] = Field(None, serialization_alias="sdkVersion", validation_alias="sdkVersion")
  app_version: Optional[str] = Field(None, serialization_alias="appVersion", validation_alias="appVersion")
  browser: Optional[str] = None
  os: Optional[str] = None
  user_agent: Optional[str] = Field(None, serialization_alias="userAgent", validation_alias="userAgent")

  model_config = {
    "populate_by_name": True,
    "from_attributes": True
  }

class DeviceCreate(DeviceBase):
  id: str

class DeviceResponse(BaseModel):
  id: str
  deviceName: str = Field(..., serialization_alias="deviceName")
  online: bool
  logCount: int = Field(..., serialization_alias="logCount")
  errorCount: int = Field(..., serialization_alias="errorCount")
  lastSeen: str = Field(..., serialization_alias="lastSeen")
  browser: Optional[str] = None
  os: Optional[str] = None
  url: Optional[str] = None

  model_config = {
    "populate_by_name": True,
    "from_attributes": True
  }

class DeviceDetailResponse(DeviceBase):
  id: str
  created_at: datetime
  last_seen: datetime

  model_config = {
    "populate_by_name": True,
    "from_attributes": True
  }
