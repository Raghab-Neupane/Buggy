from pydantic import BaseModel, Field, AliasChoices
from datetime import datetime
from typing import Any, Dict, Optional

class LogBase(BaseModel):
  level: str
  message: str
  timestamp: str
  deviceid: str = Field(..., serialization_alias="deviceid", validation_alias=AliasChoices("deviceid", "deviceId", "sessionId"))
  url: Optional[str] = None
  stackTrace: Optional[str] = Field(None, serialization_alias="stackTrace", validation_alias="stackTrace")

  model_config = {
    "populate_by_name": True,
    "from_attributes": True
  }

class LogEventSchema(BaseModel):
  deviceId: str = Field(..., serialization_alias="deviceId", validation_alias="deviceId")
  sessionId: str = Field(..., serialization_alias="sessionId", validation_alias="sessionId")
  sessionStartedAt: Optional[str] = Field(None, serialization_alias="sessionStartedAt", validation_alias="sessionStartedAt")
  level: str
  message: str
  timestamp: str
  browser: str
  browserVersion: Optional[str] = Field(None, serialization_alias="browserVersion", validation_alias="browserVersion")
  deviceName: Optional[str] = Field(None, serialization_alias="deviceName", validation_alias="deviceName")
  os: Optional[str] = None
  latitude: Optional[float] = None
  longitude: Optional[float] = None
  url: str

  model_config = {
    "populate_by_name": True,
    "from_attributes": True
  }

class LogResponse(BaseModel):
  id: str
  deviceId: str = Field(..., serialization_alias="deviceId")
  level: str
  message: str
  timestamp: datetime
  url: Optional[str] = None
  stackTrace: Optional[str] = Field(None, serialization_alias="stackTrace")
  deviceid: str = Field(..., serialization_alias="deviceid")
  created_at: datetime
  location: Optional[Dict[str, Any]] = None
  
  # Flat fields mapped from Device
  browser: Optional[str] = None
  browserVersion: Optional[str] = Field(None, serialization_alias="browserVersion")
  deviceName: Optional[str] = Field(None, serialization_alias="deviceName")
  os: Optional[str] = None
  latitude: Optional[float] = None
  longitude: Optional[float] = None
  sessionStartedAt: Optional[datetime] = Field(None, serialization_alias="sessionStartedAt")

  model_config = {
    "populate_by_name": True,
    "from_attributes": True
  }
