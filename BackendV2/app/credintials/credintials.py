from pydantic import BaseModel

class userdetails(BaseModel):
    email: str
    password: str


