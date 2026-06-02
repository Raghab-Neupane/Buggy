from fastapi import FastAPI
# pyrefly: ignore [missing-import]
from fastapi.middleware.cors import CORSMiddleware;

app = FastAPI()

#CORS middlewear:
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

logs = [ ]

@app.post("/logs")
def create_log(log: dict):
    logs.append(log)
    return {"success": True}

@app.get("/dashboard")
def get_logs():
    return logs