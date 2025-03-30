import uvicorn
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from pydantic import BaseModel
from typing import List, Dict, Optional
from fastapi.middleware.cors import CORSMiddleware
import asyncio

app = FastAPI()

origins = [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://localhost:8081"
]

app.add_middleware(CORSMiddleware, allow_origins=origins, allow_credentials=True, allow_methods=[""], allow_headers=[""])

memory_db = {"alerts": []}

class ConnectionManager:
    def _init_(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, user_type: str, user_id: Optional[int] = None):
        await websocket.accept()
        key = f"{user_type}_{user_id}" if user_id else user_type
        if key not in self.active_connections:
            self.active_connections[key] = []
        self.active_connections[key].append(websocket)

    def disconnect(self, websocket: WebSocket, user_type: str, user_id: Optional[int] = None):
        key = f"{user_type}_{user_id}" if user_id else user_type
        if key in self.active_connections and websocket in self.active_connections[key]:
            self.active_connections[key].remove(websocket)

    async def broadcast(self, message: str, user_type: str, user_id: Optional[int] = None):
        key = f"{user_type}_{user_id}" if user_id else user_type
        if key in self.active_connections:
            for connection in self.active_connections[key]:
                try:
                    await connection.send_text(message)
                except WebSocketDisconnect:
                    self.disconnect(connection, user_type, user_id)

manager = ConnectionManager()

@app.get("/alerts/{driver_id}")
async def get_alerts(driver_id: int):
    return [alert for alert in memory_db["alerts"] if alert["driverId"] == driver_id]

@app.websocket("/ws/{user_type}/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_type: str, user_id: int):
    await manager.connect(websocket, user_type, user_id)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket, user_type, user_id)

class DrivingData(BaseModel):
    id: int
    passengerId: int
    driverId: int
    speed: float
    acceleration: float
    braking_force: float
    deviation: float
    allowed_speed: float = 80.0

@app.post("/send_data/")
async def send_data(data: DrivingData):
    dataAlert = {
        "id": data.id,
        "driverId": data.driverId,
        "passengerId": data.passengerId,
        "alerts": []
    }

    if data.speed > data.allowed_speed:
        dataAlert["alerts"].append({
            "driver": "⚠ Превышение скорости! Снизьте скорость.",
            "passenger": "⚠ Водитель превысил скорость!",
            "dispatcher": "⚠ Водитель маршрута X превысил скорость!"
        })

    if data.acceleration > 4:
        dataAlert["alerts"].append({
            "driver": "⚠ Резкое ускорение! Будьте осторожны.",
            "passenger": "",
            "dispatcher": "⚠ Водитель маршрута X резко ускорился."
        })

    if data.braking_force > 5:
        dataAlert["alerts"].append({
            "driver": "⚠ Опасное торможение! Умерьте стиль вождения.",
            "passenger": "",
            "dispatcher": "⚠ Водитель маршрута X резко затормозил."
        })

    if data.deviation > 50:
        dataAlert["alerts"].append({
            "driver": "⚠ Вы отклонились от маршрута!",
            "passenger": "⚠ Машина отклоняется от маршрута!",
            "dispatcher": "⚠ Водитель маршрута X изменил маршрут."
        })

    if dataAlert["alerts"]:
        memory_db["alerts"].append(dataAlert)
        for alert in dataAlert["alerts"]:
            await manager.broadcast(alert["driver"], "driver", data.driverId)
            await manager.broadcast(alert["passenger"], "passenger", data.passengerId)
            await manager.broadcast(alert["dispatcher"], "dispatcher")
        return {"status": "warning", "alerts": dataAlert["alerts"]}

    return {"status": "ok", "message": "Все нормально"}

if _name_ == "_main_":
    uvicorn.run(app, host="0.0.0.0", port=8000)