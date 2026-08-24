import pytest

from app.samsung.errors import PublicIpRejected
from app.security.local_ip import parse_port, require_private_tv_host


def test_private_ipv4_accepted():
    assert str(require_private_tv_host("192.168.1.50")) == "192.168.1.50"
    assert str(require_private_tv_host("10.0.0.8")) == "10.0.0.8"
    assert str(require_private_tv_host("172.16.9.4")) == "172.16.9.4"


def test_public_ip_rejected():
    with pytest.raises(PublicIpRejected):
        require_private_tv_host("8.8.8.8")
    with pytest.raises(PublicIpRejected):
        require_private_tv_host("1.1.1.1")


def test_loopback_rejected_for_tv():
    with pytest.raises(ValueError):
        require_private_tv_host("127.0.0.1")


def test_invalid_ip_rejected():
    with pytest.raises(ValueError):
        require_private_tv_host("not-an-ip")


def test_port_parsing():
    assert parse_port("8080") == 8080
    assert parse_port(8000) == 8000
    with pytest.raises(ValueError):
        parse_port(0)
    with pytest.raises(ValueError):
        parse_port(70000)
    with pytest.raises(ValueError):
        parse_port("nope")


def test_settings_reject_fake_in_production():
    from app.config import Settings

    settings = Settings(environment="production", allow_fake_protocol=True, protocol="fake")
    assert settings.fake_protocol_allowed is False
