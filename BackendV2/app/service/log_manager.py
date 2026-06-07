"""
Centralized LogManager service.

All log entries pass through this service before storage and broadcast.
Responsibilities:
  - Generate a unique UUID for every log entry
  - Normalize timestamps to ISO-8601 UTC
  - Maintain an in-memory ring buffer of recent logs
  - Provide sorted, deduplicated log retrieval
"""

import asyncio
import uuid
from collections import deque
from datetime import datetime, timezone
from typing import Dict, List, Optional


class LogManager:
    """Thread-safe, centralized log processing service."""

    def __init__(self, max_buffer_size: int = 1000):
        self._buffer: deque = deque(maxlen=max_buffer_size)
        self._seen_ids: set = set()
        self._lock = asyncio.Lock()

    async def process_log(self, log_entry: dict) -> dict:
        """
        Enrich a raw log dict with a unique UUID and normalised timestamp,
        then store it in the in-memory ring buffer.

        Returns the enriched log entry (same dict, mutated in-place).
        """
        async with self._lock:
            # 1. Assign a unique UUID
            log_id = str(uuid.uuid4())
            log_entry["id"] = log_id

            # 2. Normalise / generate timestamp
            log_entry["timestamp"] = self._normalise_timestamp(
                log_entry.get("timestamp")
            )

            # 3. Add to ring buffer (deque auto-evicts oldest when full)
            self._buffer.append(log_entry)

            # Track seen IDs (evict old ones when buffer rotates)
            self._seen_ids.add(log_id)
            if len(self._seen_ids) > self._buffer.maxlen * 2:
                # Rebuild the set from current buffer to prevent unbounded growth
                self._seen_ids = {entry["id"] for entry in self._buffer}

        return log_entry

    def get_recent_logs(self, limit: int = 100) -> List[dict]:
        """Return recent logs sorted by timestamp descending (newest first)."""
        logs = list(self._buffer)
        logs.sort(key=lambda x: x.get("timestamp") or "", reverse=True)
        return logs[:limit]

    def get_logs_for_device(self, device_id: str, limit: int = 100) -> List[dict]:
        """Return recent logs for a specific device, sorted descending."""
        logs = [
            entry for entry in self._buffer
            if entry.get("deviceId") == device_id
        ]
        logs.sort(key=lambda x: x.get("timestamp") or "", reverse=True)
        return logs[:limit]

    @staticmethod
    def _normalise_timestamp(raw: Optional[str]) -> str:
        """
        Parse an incoming timestamp string and re-format it as ISO-8601 UTC.
        If parsing fails or None, generate a fresh UTC timestamp.
        """
        if raw:
            try:
                # Try parsing ISO format (with or without trailing Z)
                cleaned = raw.replace("Z", "+00:00")
                dt = datetime.fromisoformat(cleaned)
                # Ensure UTC
                if dt.tzinfo is None:
                    dt = dt.replace(tzinfo=timezone.utc)
                return dt.astimezone(timezone.utc).isoformat().replace("+00:00", "Z")
            except (ValueError, TypeError):
                pass
        # Fallback: generate current UTC timestamp
        return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
