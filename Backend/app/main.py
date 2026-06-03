from fastapi import FastAPI, Request, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from app.api.devices import router as devices_router
from app.api.logs import router as logs_router
from app.api.stats import router as stats_router
from app.schemas.device import DeviceResponse
from app.schema.schema import LocationResponse # Keep old schema import for location compatibility
from app.services.location import resolve_location
from app.websocket.manager import websocket_manager

app = FastAPI(title="Buggy Observability Engine", version="1.0.0")

# Register CORS middleware for local development
app.add_middleware(
  CORSMiddleware,
  allow_origins=["*"],
  allow_credentials=True,
  allow_methods=["*"],
  allow_headers=["*"],
)

# Keep Geolocation endpoint for SDK location resolution
@app.get("/location", response_model=LocationResponse, tags=["utilities"])
async def get_location(request: Request):
  forwarded_for = request.headers.get("x-forwarded-for")
  if forwarded_for:
    client_ip = forwarded_for.split(",")[0].strip()
  else:
    real_ip = request.headers.get("x-real-ip")
    if real_ip:
      client_ip = real_ip.strip()
    else:
      client_ip = request.client.host if request.client else "127.0.0.1"

  location_data = await resolve_location(client_ip)
  return location_data

# Register API Routers
app.include_router(devices_router)
app.include_router(logs_router)
app.include_router(stats_router)

# Real-Time WebSocket Streaming Endpoint
@app.websocket("/devices/{device_id}/stream")
async def websocket_device_stream(websocket: WebSocket, device_id: str):
  await websocket_manager.connect(device_id, websocket)
  try:
    while True:
      # Keep the socket link active by receiving frames (ping/pong, etc.)
      await websocket.receive_text()
  except WebSocketDisconnect:
    websocket_manager.disconnect(device_id, websocket)
  except Exception:
    websocket_manager.disconnect(device_id, websocket)