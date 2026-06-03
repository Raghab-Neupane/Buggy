from typing import Dict, Set
from fastapi import WebSocket
import json
from app.schemas.log import LogResponse

class WebSocketManager:
  def __init__(self):
    # Maps device_id -> Set of active WebSockets
    self.active_connections: Dict[str, Set[WebSocket]] = {}

  async def connect(self, device_id: str, websocket: WebSocket):
    await websocket.accept()
    if device_id not in self.active_connections:
      self.active_connections[device_id] = set()
    self.active_connections[device_id].add(websocket)

  def disconnect(self, device_id: str, websocket: WebSocket):
    if device_id in self.active_connections:
      self.active_connections[device_id].remove(websocket)
      if not self.active_connections[device_id]:
        del self.active_connections[device_id]

  async def broadcast_log(self, device_id: str, log: LogResponse):
    if device_id in self.active_connections:
      # Serialize using Pydantic model_dump_json for alias support (camelCase keys)
      payload = log.model_dump_json(by_alias=True)
      
      # We construct a list of active sockets to check for closed ones during execution
      sockets = list(self.active_connections[device_id])
      for connection in sockets:
        try:
          await connection.send_text(payload)
        except Exception:
          # Handle disconnected socket cleanup safely
          self.disconnect(device_id, connection)

# Singleton global manager instance
websocket_manager = WebSocketManager()
