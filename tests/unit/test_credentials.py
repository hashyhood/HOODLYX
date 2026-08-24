from app.config import Settings
from app.samsung.models import DeviceRecord, PairingCredentials
from app.storage.credential_store import CredentialStore
from app.storage.device_store import DeviceStore


def test_credentials_roundtrip_without_plaintext_logs(tmp_path, caplog):
    store = CredentialStore(tmp_path)
    creds = PairingCredentials(token="a" * 32, session_id="99")
    with caplog.at_level("INFO"):
        store.save(creds)
        loaded = store.load()
    assert loaded is not None
    assert loaded.token == creds.token
    assert loaded.session_id == creds.session_id
    joined = " ".join(record.getMessage() for record in caplog.records)
    assert "a" * 32 not in joined
    store.delete()
    assert store.load() is None


def test_device_reset_and_invalid_flag(tmp_path):
    devices = DeviceStore(tmp_path / "device.json")
    record = DeviceRecord(
        host="192.168.1.50",
        display_name="Living Room",
        model="UA55H6400",
        auth_port=8080,
        remote_port=8000,
        credentials_valid=True,
    )
    devices.save(record)
    devices.mark_invalid(record)
    loaded = devices.load()
    assert loaded is not None
    assert loaded.credentials_valid is False
    devices.clear()
    assert devices.load() is None


def test_settings_reject_fake_in_production():
    settings = Settings(environment="production", allow_fake_protocol=True, protocol="fake")
    assert settings.fake_protocol_allowed is False
