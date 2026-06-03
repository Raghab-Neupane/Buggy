import os
import logging
import time
from typing import Dict, Optional, Tuple
import geoip2.database
from geoip2.errors import AddressNotFoundError

logger = logging.getLogger(__name__)

# Configurable Cache: TTL in seconds (default 24 hours)
CACHE_TTL_SECONDS = 86400
DB_PATH = os.path.join(os.path.dirname(__file__), "GeoLite2-City.mmdb")

class LocationCache:
    def __init__(self, ttl: int = CACHE_TTL_SECONDS):
        self.ttl = ttl
        # maps ip -> (timestamp, data)
        self.cache: Dict[str, Tuple[float, dict]] = {}

    def get(self, ip: str) -> Optional[dict]:
        if ip not in self.cache:
            return None
        timestamp, data = self.cache[ip]
        if time.time() - timestamp > self.ttl:
            del self.cache[ip]
            return None
        return data

    def set(self, ip: str, data: dict):
        self.cache[ip] = (time.time(), data)

# Global cache instance
location_cache = LocationCache()

def is_private_ip(ip: str) -> bool:
    """Check if the IP is localhost or within private IPv4/IPv6 ranges."""
    if not ip:
        return True
    
    if ip in ("127.0.0.1", "::1", "localhost"):
        return True
        
    if ip.startswith("10.") or ip.startswith("192.168."):
        return True
        
    if ip.startswith("172."):
        parts = ip.split(".")
        if len(parts) >= 2:
            try:
                second_octet = int(parts[1])
                if 16 <= second_octet <= 31:
                    return True
            except ValueError:
                pass
                
    if ip.startswith("169.254."):
        return True
        
    if ip.startswith("fe80:") or ip.startswith("fec0:"):
        return True
        
    return False

async def resolve_location(ip: str) -> dict:
    """
    Resolve geolocation for a given IP address using local GeoLite2 database.
    Checks private ranges and cache before querying the database.
    """
    default_data = {
        "ip": ip,
        "country": "unknown",
        "city": "unknown",
        "region": "unknown",
        "latitude": None,
        "longitude": None
    }

    if not ip or is_private_ip(ip):
        return {
            "ip": ip or "127.0.0.1",
            "country": "Localhost",
            "city": "Localhost",
            "region": "Localhost",
            "latitude": None,
            "longitude": None
        }

    # Check cache
    cached = location_cache.get(ip)
    if cached:
        return cached

    # Query local GeoLite2-City database
    if not os.path.exists(DB_PATH):
        logger.error(f"GeoLite2 database not found at {DB_PATH}. Returning default geolocation values.")
        return default_data

    try:
        with geoip2.database.Reader(DB_PATH) as reader:
            response = reader.city(ip)
            
            # Subdivision/Region extraction
            region = "unknown"
            if response.subdivisions and response.subdivisions.most_specific:
                region = response.subdivisions.most_specific.name or "unknown"

            result = {
                "ip": ip,
                "country": response.country.name or "unknown",
                "city": response.city.name or "unknown",
                "region": region,
                "latitude": response.location.latitude,
                "longitude": response.location.longitude
            }
            location_cache.set(ip, result)
            return result
    except AddressNotFoundError:
        logger.warning(f"IP address {ip} not found in GeoLite2 database.")
        location_cache.set(ip, default_data)
        return default_data
    except Exception as e:
        logger.error(f"Failed to query GeoLite2 database for IP {ip}: {e}")
        return default_data
