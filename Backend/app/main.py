from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.responses import HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from app.api.devices import router as devices_router
from app.api.logs import router as logs_router
from app.api.stats import router as stats_router
from app.db.database import core_engine
from app.websocket.manager import websocket_manager

app = FastAPI(title="Buggy Observability Engine", version="1.0.0")


@app.on_event("startup")
async def ensure_core_schema():
  async with core_engine.begin() as conn:
    result = await conn.execute(
      text(
        """
        SELECT COUNT(*)
        FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'devices'
          AND COLUMN_NAME = 'location'
        """
      )
    )
    has_location_column = result.scalar() or 0

    if not has_location_column:
      await conn.execute(
        text(
          """
          ALTER TABLE devices
            ADD COLUMN location JSON NULL AFTER session_id
          """
        )
      )

# Serve shared storage iframe
@app.get("/iframe.html", response_class=HTMLResponse, tags=["utilities"])
async def get_iframe():
  html_content = """<!DOCTYPE html>
<html>
<head>
  <title>Buggy Device Registry</title>
</head>
<body>
  <script>
    window.addEventListener("message", (event) => {
      const data = event.data;
      if (data && data.type === "GET_OR_CREATE_DEVICE_ID") {
        const storageKey = "buggy_device_id";
        const tsKey = "buggy_device_id_last_updated";

        let cachedId = localStorage.getItem(storageKey);
        const lastUpdated = localStorage.getItem(tsKey);
        const now = Date.now();
        const cacheDuration = data.cacheDurationMs || 86400000;

        let shouldUpdate = false;
        if (cachedId && lastUpdated) {
          const timeDiff = now - parseInt(lastUpdated, 10);
          if (timeDiff >= cacheDuration) {
            shouldUpdate = true;
          }
        } else {
          shouldUpdate = true;
        }

        if (shouldUpdate || !cachedId) {
          cachedId = data.fingerprint;
          localStorage.setItem(storageKey, cachedId);
          localStorage.setItem(tsKey, String(now));
        }

        event.source.postMessage({
          type: "RESOLVED_DEVICE_ID",
          deviceId: cachedId
        }, event.origin);
      }
    });
  </script>
</body>
</html>
"""
  return HTMLResponse(content=html_content)

# Register CORS middleware for local development
app.add_middleware(
  CORSMiddleware,
  allow_origins=["*"],
  allow_credentials=True,
  allow_methods=["*"],
  allow_headers=["*"],
)

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
