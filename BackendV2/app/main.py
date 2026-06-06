from fastapi import FastAPI

app = FastAPI()

@app.get("/dashboard")
def read_root():
    return('hello world')

# @app.post("/logs")
# def ingest_logs(request: Request):
    
    