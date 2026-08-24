import time

from app.security.phone_pairing import PhonePairingService
from app.security.rate_limit import SlidingWindowLimiter
from app.security.secrets import generate_host_secret


def test_phone_code_expires_and_single_use():
    service = PhonePairingService(ttl_seconds=1, host_secret=generate_host_secret())
    issued = service.issue_code()
    session = service.redeem(issued.code, client_ip="192.168.1.20", user_agent="test")
    assert service.get(session.session_id) is not None
    try:
        service.redeem(issued.code, client_ip="192.168.1.20", user_agent="test")
        raised = False
    except PermissionError:
        raised = True
    assert raised


def test_phone_code_ttl(monkeypatch):
    service = PhonePairingService(ttl_seconds=1, host_secret=generate_host_secret())
    issued = service.issue_code()
    issued.expires_at = time.monotonic() - 1
    try:
        service.redeem(issued.code, client_ip="192.168.1.20", user_agent="test")
        ok = True
    except PermissionError:
        ok = False
    assert ok is False


def test_phone_session_revocation():
    service = PhonePairingService(ttl_seconds=60, host_secret=generate_host_secret())
    issued = service.issue_code()
    session = service.redeem(issued.code, client_ip="192.168.1.20", user_agent="phone")
    assert service.active_count() == 1
    assert service.revoke_all() == 1
    assert service.get(session.session_id) is None
    cookie = service.cookie_value(session.session_id)
    assert service.parse_cookie(cookie) == session.session_id
    assert service.parse_cookie("tampered") is None


def test_rate_limiter():
    limiter = SlidingWindowLimiter(max_events=3, window_s=1)
    assert limiter.hit("a").allowed
    assert limiter.hit("a").allowed
    assert limiter.hit("a").allowed
    denied = limiter.hit("a")
    assert denied.allowed is False
    assert denied.retry_after_ms >= 1
