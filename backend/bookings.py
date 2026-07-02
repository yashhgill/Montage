"""
Montage Events — Bookings module.
Handles the booking wizard flow: survey -> package -> venue/date/time ->
RM500 deposit via ToyyibPay -> confirmation email + Google Calendar block.

All external integrations (ToyyibPay, Google Calendar, SMTP email) read their
credentials from environment variables and degrade gracefully if not configured,
so the API always boots even before secrets are set on Render.
"""

import os
import json
import uuid
import logging
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timezone, timedelta
from typing import List, Optional

import requests
from fastapi import APIRouter, HTTPException, Header, Request
from pydantic import BaseModel, Field, ConfigDict

logger = logging.getLogger("montage.bookings")

# ─── Config from environment ────────────────────────────────
DEPOSIT_AMOUNT_RM = 500  # flat deposit for every package
DEPOSIT_AMOUNT_CENTS = DEPOSIT_AMOUNT_RM * 100

TOYYIBPAY_BASE = os.environ.get("TOYYIBPAY_BASE", "https://toyyibpay.com")
TOYYIBPAY_SECRET = os.environ.get("TOYYIBPAY_SECRET_KEY", "")
TOYYIBPAY_CATEGORY = os.environ.get("TOYYIBPAY_CATEGORY_CODE", "")

SITE_URL = os.environ.get("SITE_URL", "https://montageevents.my")
BACKEND_PUBLIC_URL = os.environ.get("BACKEND_PUBLIC_URL", "")  # e.g. https://montage-api.onrender.com

GOOGLE_SA_JSON = os.environ.get("GOOGLE_SA_JSON", "")           # service account key JSON (string)
GOOGLE_CALENDAR_ID = os.environ.get("GOOGLE_CALENDAR_ID", "")   # calendar shared with the SA
EVENT_TIMEZONE = os.environ.get("EVENT_TIMEZONE", "Asia/Kuala_Lumpur")

SMTP_HOST = os.environ.get("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.environ.get("SMTP_PORT", "587"))
SMTP_USER = os.environ.get("SMTP_USER", "")                     # jojo@montageevents.my
SMTP_PASS = os.environ.get("SMTP_PASS", "")                     # Google app password
FROM_EMAIL = os.environ.get("FROM_EMAIL", "jojo@montageevents.my")
FROM_NAME = os.environ.get("FROM_NAME", "Montage Events")

# Time slots offered in the wizard
TIME_SLOTS = ["Morning (10am - 2pm)", "Afternoon (2pm - 6pm)", "Evening (6pm - 11pm)", "Full Day"]


# ─── Models ─────────────────────────────────────────────────
class BookingRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")
    # survey
    heard_from: str                       # e.g. "recent_event", "instagram", "google", "friend", "other"
    heard_from_detail: Optional[str] = ""
    is_complimentary: bool = False        # true when heard_from == recent_event
    # package
    package_id: str
    package_name: str
    package_price: str                    # display string, e.g. "RM 7,999"
    # event
    venue: str
    event_date: str                       # ISO date "YYYY-MM-DD"
    time_slot: str
    pax: Optional[str] = ""
    notes: Optional[str] = ""
    # contact
    name: str
    email: str
    phone: str


class BookingRecord(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    reference: str
    status: str = "pending"               # pending | paid | failed | cancelled
    heard_from: str = ""
    heard_from_detail: str = ""
    is_complimentary: bool = False
    package_id: str = ""
    package_name: str = ""
    package_price: str = ""
    venue: str = ""
    event_date: str = ""
    time_slot: str = ""
    pax: str = ""
    notes: str = ""
    name: str = ""
    email: str = ""
    phone: str = ""
    bill_code: str = ""
    payment_url: str = ""
    deposit_rm: int = DEPOSIT_AMOUNT_RM
    calendar_event_id: str = ""
    email_sent: bool = False
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    paid_at: str = ""


# ─── Integrations ───────────────────────────────────────────
def create_toyyibpay_bill(record: BookingRecord) -> dict:
    """Create a ToyyibPay bill and return {bill_code, payment_url}. Raises on failure."""
    if not TOYYIBPAY_SECRET or not TOYYIBPAY_CATEGORY:
        raise HTTPException(status_code=503, detail="Payment gateway not configured yet")
    if not BACKEND_PUBLIC_URL:
        raise HTTPException(status_code=503, detail="BACKEND_PUBLIC_URL not configured")

    payload = {
        "userSecretKey": TOYYIBPAY_SECRET,
        "categoryCode": TOYYIBPAY_CATEGORY,
        "billName": "Montage Booking Deposit",
        "billDescription": f"{record.package_name} deposit ({record.reference})",
        "billPriceSetting": 1,
        "billPayorInfo": 1,
        "billAmount": DEPOSIT_AMOUNT_CENTS,
        "billReturnUrl": f"{SITE_URL}/bookings/success?ref={record.reference}",
        "billCallbackUrl": f"{BACKEND_PUBLIC_URL}/api/bookings/callback",
        "billExternalReferenceNo": record.reference,
        "billTo": record.name,
        "billEmail": record.email,
        "billPhone": record.phone or "0000000000",
        "billPaymentChannel": 2,  # FPX + card
    }
    resp = requests.post(f"{TOYYIBPAY_BASE}/index.php/api/createBill", data=payload, timeout=20)
    try:
        data = resp.json()
    except Exception:
        logger.error("ToyyibPay non-JSON response: %s", resp.text[:300])
        raise HTTPException(status_code=502, detail="Payment gateway error")

    if isinstance(data, list) and data and data[0].get("BillCode"):
        bill_code = data[0]["BillCode"]
        return {"bill_code": bill_code, "payment_url": f"{TOYYIBPAY_BASE}/{bill_code}"}
    logger.error("ToyyibPay createBill failed: %s", data)
    raise HTTPException(status_code=502, detail="Could not create payment bill")


def _slot_times(date_str: str, time_slot: str):
    """Return (start_iso, end_iso) local datetimes for the chosen slot."""
    d = datetime.strptime(date_str, "%Y-%m-%d")
    ranges = {
        "Morning (10am - 2pm)": (10, 14),
        "Afternoon (2pm - 6pm)": (14, 18),
        "Evening (6pm - 11pm)": (18, 23),
        "Full Day": (9, 23),
    }
    start_h, end_h = ranges.get(time_slot, (9, 23))
    start = d.replace(hour=start_h, minute=0, second=0)
    end = d.replace(hour=end_h, minute=0, second=0)
    return start.isoformat(), end.isoformat()


def block_calendar_slot(record: BookingRecord) -> str:
    """Create a calendar event for the booked slot. Returns event id or ''."""
    if not GOOGLE_SA_JSON or not GOOGLE_CALENDAR_ID:
        logger.warning("Google Calendar not configured; skipping calendar block")
        return ""
    try:
        from google.oauth2 import service_account
        from googleapiclient.discovery import build

        info = json.loads(GOOGLE_SA_JSON)
        creds = service_account.Credentials.from_service_account_info(
            info, scopes=["https://www.googleapis.com/auth/calendar"]
        )
        service = build("calendar", "v3", credentials=creds, cache_discovery=False)
        start_iso, end_iso = _slot_times(record.event_date, record.time_slot)
        event = {
            "summary": f"[BOOKED] {record.package_name} — {record.name}",
            "description": (
                f"Reference: {record.reference}\n"
                f"Package: {record.package_name} ({record.package_price})\n"
                f"Pax: {record.pax}\n"
                f"Venue: {record.venue}\n"
                f"Contact: {record.name} / {record.phone} / {record.email}\n"
                f"Notes: {record.notes}"
            ),
            "start": {"dateTime": start_iso, "timeZone": EVENT_TIMEZONE},
            "end": {"dateTime": end_iso, "timeZone": EVENT_TIMEZONE},
            "transparency": "opaque",
        }
        created = service.events().insert(calendarId=GOOGLE_CALENDAR_ID, body=event).execute()
        return created.get("id", "")
    except Exception as e:
        logger.exception("Calendar block failed: %s", e)
        return ""


def send_confirmation_email(record: BookingRecord) -> bool:
    """Send confirmation email from jojo@montageevents.my. Returns success bool."""
    if not SMTP_USER or not SMTP_PASS:
        logger.warning("SMTP not configured; skipping confirmation email")
        return False
    try:
        full_due = _full_payment_due(record.event_date)
        html = f"""
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0A0A12;color:#fff;padding:32px;border-radius:12px">
          <h1 style="color:#00F0FF;margin:0 0 4px">Booking Confirmed</h1>
          <p style="color:#bbb;margin:0 0 24px">Thank you, {record.name}! Your deposit is received.</p>
          <div style="background:#14141f;border-radius:10px;padding:20px;margin-bottom:20px">
            <p style="margin:0 0 10px"><b style="color:#FF2DD4">Reference:</b> {record.reference}</p>
            <p style="margin:0 0 10px"><b>Package:</b> {record.package_name} ({record.package_price})</p>
            <p style="margin:0 0 10px"><b>Event date:</b> {record.event_date}</p>
            <p style="margin:0 0 10px"><b>Time:</b> {record.time_slot}</p>
            <p style="margin:0 0 10px"><b>Venue:</b> {record.venue}</p>
            <p style="margin:0 0 10px"><b>Pax:</b> {record.pax}</p>
            <p style="margin:0"><b>Deposit paid:</b> RM {record.deposit_rm}.00</p>
          </div>
          <div style="background:#2a1500;border:1px solid #FF6A00;border-radius:10px;padding:16px;font-size:13px;color:#ffcfa0">
            <p style="margin:0 0 6px"><b>Important terms</b></p>
            <p style="margin:0 0 6px">• The RM{record.deposit_rm} deposit is non-refundable in the event of cancellation.</p>
            <p style="margin:0">• Full payment must be completed no later than <b>{full_due}</b> (30 days before your event).</p>
          </div>
          <p style="color:#777;font-size:12px;margin-top:24px">Montage Events · Shah Alam, Malaysia<br/>Reply to this email for any changes.</p>
        </div>
        """
        msg = MIMEMultipart("alternative")
        msg["Subject"] = f"Montage Booking Confirmed — {record.reference}"
        msg["From"] = f"{FROM_NAME} <{FROM_EMAIL}>"
        msg["To"] = record.email
        msg["Bcc"] = FROM_EMAIL
        msg.attach(MIMEText(html, "html"))

        with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=20) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASS)
            server.send_message(msg)
        return True
    except Exception as e:
        logger.exception("Email send failed: %s", e)
        return False


def _full_payment_due(event_date: str) -> str:
    try:
        d = datetime.strptime(event_date, "%Y-%m-%d")
        return (d - timedelta(days=30)).strftime("%d %b %Y")
    except Exception:
        return "30 days before the event"


# ─── Router factory ─────────────────────────────────────────
def build_bookings_router(db, admin_token: str) -> APIRouter:
    router = APIRouter(prefix="/bookings")

    def _gen_reference() -> str:
        return "MTG-" + datetime.now().strftime("%y%m%d") + "-" + uuid.uuid4().hex[:5].upper()

    @router.get("/config")
    async def booking_config():
        return {
            "deposit_rm": DEPOSIT_AMOUNT_RM,
            "time_slots": TIME_SLOTS,
            "payment_ready": bool(TOYYIBPAY_SECRET and TOYYIBPAY_CATEGORY),
        }

    @router.get("/availability")
    async def availability():
        """Return list of {date, time_slot} already taken by paid or pending bookings."""
        cutoff = (datetime.now(timezone.utc) - timedelta(hours=2)).isoformat()
        taken = await db.event_bookings.find(
            {"$or": [
                {"status": "paid"},
                {"status": "pending", "created_at": {"$gte": cutoff}},
            ]},
            {"_id": 0, "event_date": 1, "time_slot": 1},
        ).to_list(2000)
        return {"taken": taken}

    @router.post("/create")
    async def create(payload: BookingRequest):
        for field in ("name", "email", "phone", "package_id", "event_date", "time_slot", "venue"):
            if not str(getattr(payload, field, "")).strip():
                raise HTTPException(status_code=400, detail=f"{field} is required")

        # prevent double-booking the same date+slot
        clash = await db.event_bookings.find_one({
            "event_date": payload.event_date,
            "time_slot": payload.time_slot,
            "status": "paid",
        })
        if clash:
            raise HTTPException(status_code=409, detail="That date and time slot is already booked")

        record = BookingRecord(reference=_gen_reference(), **payload.model_dump())
        bill = create_toyyibpay_bill(record)
        record.bill_code = bill["bill_code"]
        record.payment_url = bill["payment_url"]

        await db.event_bookings.insert_one(record.model_dump())
        return {"reference": record.reference, "payment_url": record.payment_url}

    @router.post("/callback")
    async def toyyibpay_callback(request: Request):
        """ToyyibPay server-to-server callback. status_id 1 = success."""
        form = await request.form()
        ref = form.get("order_id") or form.get("billExternalReferenceNo") or ""
        status_id = str(form.get("status") or form.get("status_id") or "")
        bill_code = form.get("billcode") or form.get("billCode") or ""

        record_doc = await db.event_bookings.find_one(
            {"$or": [{"reference": ref}, {"bill_code": bill_code}]}, {"_id": 0}
        )
        if not record_doc:
            logger.warning("Callback for unknown booking ref=%s bill=%s", ref, bill_code)
            return {"ok": True}

        if record_doc.get("status") == "paid":
            return {"ok": True}  # idempotent

        if status_id == "1":
            record = BookingRecord(**record_doc)
            record.status = "paid"
            record.paid_at = datetime.now(timezone.utc).isoformat()
            record.calendar_event_id = block_calendar_slot(record)
            record.email_sent = send_confirmation_email(record)
            await db.event_bookings.update_one(
                {"reference": record.reference},
                {"$set": {
                    "status": "paid",
                    "paid_at": record.paid_at,
                    "calendar_event_id": record.calendar_event_id,
                    "email_sent": record.email_sent,
                }},
            )
        elif status_id == "3":
            await db.event_bookings.update_one(
                {"reference": record_doc["reference"]}, {"$set": {"status": "failed"}}
            )
        return {"ok": True}

    @router.get("/status/{reference}")
    async def status(reference: str):
        doc = await db.event_bookings.find_one({"reference": reference}, {"_id": 0})
        if not doc:
            raise HTTPException(status_code=404, detail="Booking not found")
        return {
            "reference": doc["reference"],
            "status": doc["status"],
            "package_name": doc.get("package_name", ""),
            "event_date": doc.get("event_date", ""),
            "time_slot": doc.get("time_slot", ""),
            "name": doc.get("name", ""),
            "email_sent": doc.get("email_sent", False),
        }

    def _verify_admin(token: str):
        if not token or token != admin_token:
            raise HTTPException(status_code=401, detail="Invalid admin token")

    @router.get("/admin/list")
    async def admin_list(x_admin_token: Optional[str] = Header(default=None)):
        _verify_admin(x_admin_token or "")
        items = await db.event_bookings.find({}, {"_id": 0}).sort("created_at", -1).to_list(2000)
        return {"bookings": items, "count": len(items)}

    return router
