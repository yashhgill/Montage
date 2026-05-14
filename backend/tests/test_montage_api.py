"""Backend tests for Montage Events API."""
import os
import pytest
import requests

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
if not BASE_URL:
    # Fallback to frontend/.env if env var not in process
    try:
        from pathlib import Path
        env_path = Path('/app/frontend/.env')
        for line in env_path.read_text().splitlines():
            if line.startswith('REACT_APP_BACKEND_URL='):
                BASE_URL = line.split('=', 1)[1].strip().strip('"').rstrip('/')
    except Exception:
        pass

ADMIN_TOKEN = "EnklMXgR3uc18Sm5QN0zqwE5qHw"
OLD_ADMIN_TOKEN = "montage2026"


class TestOldTokenRejected:
    def test_old_token_verify_rejected(self):
        r = requests.post(f"{BASE_URL}/api/admin/verify", json={"token": OLD_ADMIN_TOKEN})
        assert r.status_code == 401

    def test_old_token_admin_bookings_rejected(self):
        r = requests.get(f"{BASE_URL}/api/admin/bookings",
                         headers={"X-Admin-Token": OLD_ADMIN_TOKEN})
        assert r.status_code == 401


@pytest.fixture(scope="module")
def client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


# ─── Root ──
class TestRoot:
    def test_root(self, client):
        r = client.get(f"{BASE_URL}/api/")
        assert r.status_code == 200
        data = r.json()
        assert data.get("message") == "Montage Events API"


# ─── Bookings ──
class TestBookings:
    created_id = None

    def test_create_booking_valid(self, client):
        payload = {
            "name": "TEST_John Doe",
            "email": "test_john@example.com",
            "phone": "60123456789",
            "event_type": "Birthday",
            "message": "Test booking message"
        }
        r = client.post(f"{BASE_URL}/api/bookings", json=payload)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["name"] == payload["name"]
        assert data["event_type"] == "Birthday"
        assert data["email"] == "test_john@example.com"
        assert "id" in data
        assert "_id" not in data
        TestBookings.created_id = data["id"]

    def test_create_booking_minimal(self, client):
        # only required: name + event_type
        r = client.post(f"{BASE_URL}/api/bookings", json={
            "name": "TEST_Minimal",
            "event_type": "Corporate"
        })
        assert r.status_code == 200
        data = r.json()
        assert data["name"] == "TEST_Minimal"
        assert data["email"] == ""

    def test_create_booking_missing_name(self, client):
        r = client.post(f"{BASE_URL}/api/bookings", json={
            "name": "",
            "event_type": "Wedding"
        })
        assert r.status_code == 400

    def test_create_booking_missing_event_type(self, client):
        r = client.post(f"{BASE_URL}/api/bookings", json={
            "name": "TEST_NoEvent",
            "event_type": ""
        })
        assert r.status_code == 400


# ─── Admin Verify ──
class TestAdminVerify:
    def test_verify_valid_token(self, client):
        r = client.post(f"{BASE_URL}/api/admin/verify", json={"token": ADMIN_TOKEN})
        assert r.status_code == 200
        assert r.json().get("ok") is True

    def test_verify_invalid_token(self, client):
        r = client.post(f"{BASE_URL}/api/admin/verify", json={"token": "wrongtoken"})
        assert r.status_code == 401

    def test_verify_empty_token(self, client):
        r = client.post(f"{BASE_URL}/api/admin/verify", json={"token": ""})
        assert r.status_code == 401


# ─── Admin Bookings ──
class TestAdminBookings:
    def test_list_bookings_with_valid_token(self, client):
        r = client.get(f"{BASE_URL}/api/admin/bookings",
                       headers={"X-Admin-Token": ADMIN_TOKEN})
        assert r.status_code == 200
        data = r.json()
        assert "bookings" in data
        assert "count" in data
        assert isinstance(data["bookings"], list)
        assert data["count"] == len(data["bookings"])
        # Verify one of our test bookings exists
        names = [b.get("name") for b in data["bookings"]]
        assert any("TEST_" in n for n in names)
        # Ensure no _id leak
        for b in data["bookings"]:
            assert "_id" not in b

    def test_list_bookings_invalid_token(self, client):
        r = client.get(f"{BASE_URL}/api/admin/bookings",
                       headers={"X-Admin-Token": "bad"})
        assert r.status_code == 401

    def test_list_bookings_missing_header(self, client):
        r = client.get(f"{BASE_URL}/api/admin/bookings")
        assert r.status_code == 401

    def test_delete_booking_invalid_token(self, client):
        # Use a fabricated id; should still 401 before reaching DB
        r = client.delete(f"{BASE_URL}/api/admin/bookings/some-id",
                          headers={"X-Admin-Token": "bad"})
        assert r.status_code == 401

    def test_delete_booking_valid_token(self, client):
        # Create then delete
        cr = client.post(f"{BASE_URL}/api/bookings", json={
            "name": "TEST_ToDelete",
            "event_type": "Other"
        })
        assert cr.status_code == 200
        bid = cr.json()["id"]
        r = client.delete(f"{BASE_URL}/api/admin/bookings/{bid}",
                          headers={"X-Admin-Token": ADMIN_TOKEN})
        assert r.status_code == 200
        assert r.json().get("ok") is True
        # Subsequent delete returns 404
        r2 = client.delete(f"{BASE_URL}/api/admin/bookings/{bid}",
                           headers={"X-Admin-Token": ADMIN_TOKEN})
        assert r2.status_code == 404


# ─── Cleanup ──
def test_zzz_cleanup(client):
    r = client.get(f"{BASE_URL}/api/admin/bookings",
                   headers={"X-Admin-Token": ADMIN_TOKEN})
    if r.status_code != 200:
        return
    for b in r.json().get("bookings", []):
        if b.get("name", "").startswith("TEST_"):
            client.delete(f"{BASE_URL}/api/admin/bookings/{b['id']}",
                          headers={"X-Admin-Token": ADMIN_TOKEN})
