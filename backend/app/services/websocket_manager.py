from __future__ import annotations

import asyncio
from collections import defaultdict
from typing import Any, Dict, Set

from fastapi import WebSocket


class ConnectionManager:
    """Tracks active websocket clients grouped by ride_id."""

    def __init__(self) -> None:
        self._rooms: Dict[str, Set[WebSocket]] = defaultdict(set)
        self._lock = asyncio.Lock()

    async def connect(self, ride_id: str, websocket: WebSocket) -> None:
        await websocket.accept()
        async with self._lock:
            self._rooms[ride_id].add(websocket)

    async def disconnect(self, ride_id: str, websocket: WebSocket) -> None:
        async with self._lock:
            clients = self._rooms.get(ride_id)
            if not clients:
                return
            clients.discard(websocket)
            if not clients:
                self._rooms.pop(ride_id, None)

    async def broadcast_to_ride(self, ride_id: str, payload: Dict[str, Any]) -> None:
        async with self._lock:
            clients = list(self._rooms.get(ride_id, set()))

        stale_clients: list[WebSocket] = []
        for ws in clients:
            try:
                await ws.send_json(payload)
            except Exception:
                stale_clients.append(ws)

        for stale_ws in stale_clients:
            await self.disconnect(ride_id, stale_ws)


connection_manager = ConnectionManager()