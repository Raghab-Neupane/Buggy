from pydantic import BaseModel, Field

class StatsResponse(BaseModel):
  totalDevices: int = Field(..., serialization_alias="totalDevices")
  onlineDevices: int = Field(..., serialization_alias="onlineDevices")
  totalLogs: int = Field(..., serialization_alias="totalLogs")
  errorsToday: int = Field(..., serialization_alias="errorsToday")

  model_config = {
    "populate_by_name": True
  }
