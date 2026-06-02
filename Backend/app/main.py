from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI, WebSocket

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

logs = []
connections = []


@app.post("/logs")
def create_log(log: dict):
    logs.append(log)
    return {"success": True}


@app.get("/dashboard")
def get_logs():
    return logs

async def broadcast_log(message: str):
    for connection in connections:
        await connection.send_text(message)

@app.get("/test")
async def test():
    print("Route hit")

    await broadcast_log("Hello from Python!")

    return {"success": True}


@app.websocket("/ws/logs")
async def websocket_logs(websocket: WebSocket):

    await websocket.accept()

    while True:
        await websocket.send_text("hello")
        import asyncio
        await asyncio.sleep(1)