from fastapi import FastAPI
from app.schema.schema import LogEvent

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

logs = []

@app.post("/logs")
async def create_log(log: LogEvent):
    logs.append(log.model_dump())
    return {
        "Status": "Sucess"
    }

@app.get("/logs")
async def get_logs():
    return logs