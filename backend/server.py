from fastapi import FastAPI, APIRouter, HTTPException, Header
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

ADMIN_TOKEN = os.environ.get('MONTAGE_ADMIN_TOKEN', 'montage2026')

# Create the main app without a prefix
app = FastAPI(title="Montage Events API")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# ─── Models ─────────────────────────────────────────────
class StatusCheck(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StatusCheckCreate(BaseModel):
    client_name: str


class BookingCreate(BaseModel):
    name: str
    email: Optional[str] = ""
    phone: Optional[str] = ""
    event_type: str
    message: Optional[str] = ""


class Booking(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email: str = ""
    phone: str = ""
    event_type: str
    message: str = ""
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class AdminVerify(BaseModel):
    token: str


# ─── Routes ─────────────────────────────────────────────
@api_router.get("/")
async def root():
    return {"message": "Montage Events API"}


@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_obj = StatusCheck(**input.model_dump())
    doc = status_obj.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    await db.status_checks.insert_one(doc)
    return status_obj


@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    status_checks = await db.status_checks.find({}, {"_id": 0}).to_list(1000)
    for check in status_checks:
        if isinstance(check.get('timestamp'), str):
            check['timestamp'] = datetime.fromisoformat(check['timestamp'])
    return status_checks


# ─── Bookings ─────────────────────────────────────────
@api_router.post("/bookings", response_model=Booking)
async def create_booking(payload: BookingCreate):
    if not payload.name.strip() or not payload.event_type.strip():
        raise HTTPException(status_code=400, detail="name and event_type are required")
    booking = Booking(
        name=payload.name.strip(),
        email=(payload.email or "").strip(),
        phone=(payload.phone or "").strip(),
        event_type=payload.event_type.strip(),
        message=(payload.message or "").strip(),
    )
    doc = booking.model_dump()
    await db.bookings.insert_one(doc)
    return booking


def _verify_admin(token: str):
    if not token or token != ADMIN_TOKEN:
        raise HTTPException(status_code=401, detail="Invalid admin token")


@api_router.post("/admin/verify")
async def admin_verify(payload: AdminVerify):
    _verify_admin(payload.token)
    return {"ok": True}


@api_router.get("/admin/bookings")
async def list_bookings(x_admin_token: Optional[str] = Header(default=None)):
    _verify_admin(x_admin_token or "")
    items = await db.bookings.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return {"bookings": items, "count": len(items)}


@api_router.delete("/admin/bookings/{booking_id}")
async def delete_booking(booking_id: str, x_admin_token: Optional[str] = Header(default=None)):
    _verify_admin(x_admin_token or "")
    result = await db.bookings.delete_one({"id": booking_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Booking not found")
    return {"ok": True}


# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
