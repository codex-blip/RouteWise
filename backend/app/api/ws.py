from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.services.websocket_manager import connection_manager

router = APIRouter()


@router.websocket("/ws/ride/{ride_id}")
async def ride_websocket(websocket: WebSocket, ride_id: str) -> None:
    await connection_manager.connect(ride_id, websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        await connection_manager.disconnect(ride_id, websocket)
    except Exception:
        await connection_manager.disconnect(ride_id, websocket)
