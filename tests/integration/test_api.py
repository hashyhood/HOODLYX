import pytest
from fastapi.testclient import TestClient

from app.config import Settings
from app.context import AppContext
from app.main import create_app
from app.samsung.errors import CredentialsRejected, ProtocolError
from app.samsung.fake_dev import FakeHSeriesRemote
from app.samsung.key_allowlist import AllowedKey
from app.samsung.models import PairingCredentials


def _settings(tmp_path) -> Settings:
    return Settings(
        environment="test",
        allow_fake_protocol=True,
        protocol="fake",
        data_dir=tmp_path,
        open_browser=False,
        http_port=8787,
        command_gap_ms=20,
    )


@pytest.fixture
def harness(tmp_path):
    fake = FakeHSeriesRemote(host="192.168.1.50")
    settings = _settings(tmp_path)
    app = create_app()
    ctx = AppContext(settings)
    ctx.controller._protocol_factory = lambda **_kwargs: fake
    app.state.settings = settings
    app.state.ctx = ctx
    with TestClient(app) as client:
        yield client, ctx, fake


def _headers(client: TestClient) -> dict[str, str]:
    token = client.get("/api/health").json()["csrf_token"]
    return {"X-CSRF-Token": token}


def test_csrf_required(harness):
    client, _ctx, _fake = harness
    res = client.post("/api/remote/key", json={"key": "KEY_VOLUP"})
    assert res.status_code == 403


def test_dangerous_key_rejected(harness):
    client, _ctx, _fake = harness
    headers = _headers(client)
    res = client.post("/api/remote/key", json={"key": "KEY_FACTORY"}, headers=headers)
    assert res.status_code == 422 or res.status_code == 400


def test_successful_first_pairing_and_command(harness):
    client, ctx, fake = harness
    headers = _headers(client)
    start = client.post(
        "/api/pairing/start",
        json={"host": "192.168.1.50", "display_name": "TV", "auth_port": 8080, "remote_port": 8000},
        headers=headers,
    )
    assert start.status_code == 200
    confirm = client.post("/api/pairing/confirm", json={"pin": "1234"}, headers=headers)
    assert confirm.status_code == 200
    assert ctx.credential_store.load() is not None
    sent = client.post("/api/remote/key", json={"key": "KEY_VOLUP"}, headers=headers)
    assert sent.status_code == 200
    assert "KEY_VOLUP" in fake.sent


def test_incorrect_pin(harness):
    client, _ctx, _fake = harness
    headers = _headers(client)
    client.post("/api/pairing/start", json={"host": "192.168.1.50"}, headers=headers)
    bad = client.post("/api/pairing/confirm", json={"pin": "0000"}, headers=headers)
    assert bad.status_code == 400


@pytest.mark.asyncio
async def test_pairing_timeout(tmp_path):
    fake = FakeHSeriesRemote(host="192.168.1.50", pairing_timeout=True)
    settings = _settings(tmp_path)
    ctx = AppContext(settings)
    ctx.controller._protocol_factory = lambda **_k: fake
    await ctx.controller.start()
    with pytest.raises(TimeoutError):
        await ctx.controller.start_pairing("192.168.1.50", 8080, 8000, "TV")
    await ctx.controller.shutdown()


@pytest.mark.asyncio
async def test_token_without_session_id(tmp_path):
    fake = FakeHSeriesRemote(host="192.168.1.50", fail_session=True)
    settings = _settings(tmp_path)
    ctx = AppContext(settings)
    ctx.controller._protocol_factory = lambda **_k: fake
    await ctx.controller.start()
    await ctx.controller.start_pairing("192.168.1.50", 8080, 8000, "TV")
    with pytest.raises(ProtocolError):
        await ctx.controller.confirm_pin("1234")
    await ctx.controller.shutdown()


@pytest.mark.asyncio
async def test_stored_credential_reconnect(tmp_path):
    fake = FakeHSeriesRemote(host="192.168.1.50")
    settings = _settings(tmp_path)
    ctx = AppContext(settings)
    ctx.controller._protocol_factory = lambda **_k: fake
    await ctx.controller.start()
    await ctx.controller.start_pairing("192.168.1.50", 8080, 8000, "TV")
    await ctx.controller.confirm_pin("1234")
    await ctx.controller.disconnect()
    await ctx.controller.connect(proof=False)
    health = await fake.health()
    assert health.connected is True
    await ctx.controller.shutdown()


@pytest.mark.asyncio
async def test_stale_credentials_require_repair(tmp_path):
    fake = FakeHSeriesRemote(host="192.168.1.50", fail_connect=True)
    settings = _settings(tmp_path)
    ctx = AppContext(settings)
    ctx.controller._protocol_factory = lambda **_k: fake
    ctx.credential_store.save(PairingCredentials(token="x" * 32, session_id="1"))
    await ctx.controller.save_device(host="192.168.1.50")
    await ctx.controller.start()
    with pytest.raises(CredentialsRejected):
        await ctx.controller.connect(proof=False)
    device = ctx.device_store.load()
    assert device is not None
    assert device.credentials_valid is False
    await ctx.controller.shutdown()


@pytest.mark.asyncio
async def test_command_success_and_failure_and_disconnect(tmp_path):
    fake = FakeHSeriesRemote(host="192.168.1.50")
    settings = _settings(tmp_path)
    ctx = AppContext(settings)
    ctx.controller._protocol_factory = lambda **_k: fake
    await ctx.controller.start()
    await ctx.controller.start_pairing("192.168.1.50", 8080, 8000, "TV")
    await ctx.controller.confirm_pin("1234")
    await ctx.controller.send_key(AllowedKey.KEY_ENTER)
    await ctx.controller._queue._queue.join()
    assert "KEY_ENTER" in fake.sent
    fake._fail_command = True
    with pytest.raises(ConnectionError):
        await ctx.controller.send_key(AllowedKey.KEY_INFO)
    fake._fail_command = False
    fake._drop_mid_command = True
    with pytest.raises(ConnectionError):
        await ctx.controller.send_key(AllowedKey.KEY_MENU)
    await ctx.controller.shutdown()


@pytest.mark.asyncio
async def test_serialized_command_delivery(tmp_path):
    fake = FakeHSeriesRemote(host="192.168.1.50")
    settings = _settings(tmp_path)
    ctx = AppContext(settings)
    ctx.controller._protocol_factory = lambda **_k: fake
    await ctx.controller.start()
    await ctx.controller.start_pairing("192.168.1.50", 8080, 8000, "TV")
    await ctx.controller.confirm_pin("1234")
    await ctx.controller.send_key(AllowedKey.KEY_LEFT)
    await ctx.controller.send_key(AllowedKey.KEY_RIGHT)
    await ctx.controller._queue._queue.join()
    assert fake.sent[-2:] == ["KEY_LEFT", "KEY_RIGHT"]
    await ctx.controller.shutdown()


def test_phone_pairing_and_unauthenticated_rejection(harness):
    client, _ctx, _fake = harness
    headers = _headers(client)
    enable = client.post("/api/phone/enable", json={"enabled": True}, headers=headers)
    assert enable.status_code == 200
    # pairing-code requires a LAN IP; in CI there may be none
    code_res = client.post("/api/phone/pairing-code", headers=headers)
    if code_res.status_code == 200:
        # cannot read full code from API by design; redeem with unknown code fails
        redeem = client.post("/api/phone/redeem", json={"code": "NOPE"}, headers=headers)
        assert redeem.status_code == 401
    revoke = client.post("/api/phone/revoke-sessions", headers=headers)
    assert revoke.status_code == 200
