# pyrefly: ignore [missing-import]
from geopy.geocoders import Nominatim
from pydantic import BaseModel

class location_schema(BaseModel):
    address: str
    details: dict[str, str]

geolocator = Nominatim(user_agent="my_app")

def reverse_geocode(lat: float, lng: float):
    location = geolocator.reverse((lat, lng))

    if not location:
        return {"error": "Address not found"}

    return {
        "address": location.address,
        "details": location.raw["address"]
    }