import pytest

from app.config import Settings
from app.context import AppContext
from app.samsung.errors import InvalidPinError, ProtocolError
from app.samsung.fake_dev import FakeHSeriesRemote
from app.samsung.models import ConnectionStatus


@pytest.mark.asyncio
async def test_pairing_state_transitions(tmp_path):
    fake = FakeHSeriesRemote(host="192.168.1.50")
    ctx = AppContext(
        Settings(environment="test", allow_fake_protocol=True, protocol="fake", data_dir=tmp_path, open_browser=False)
    )
    ctx.controller._protocol_factory = lambda **_k: fake
    await ctx.controller.start()
    await ctx.controller.start_pairing("192.168.1.50", 8080, 8000, "TV")
    assert fake._status is ConnectionStatus.WAITING_FOR_PIN
    with pytest.raises(InvalidPinError):
        await ctx.controller.confirm_pin("0000")
    await ctx.controller.confirm_pin("1234")
    health = await fake.health()
    assert health.connected is True
    await ctx.controller.shutdown()


@pytest.mark.asyncio
async def test_session_missing_after_pin(tmp_path):
    fake = FakeHSeriesRemote(host="192.168.1.50", fail_session=True)
    ctx = AppContext(
        Settings(environment="test", allow_fake_protocol=True, protocol="fake", data_dir=tmp_path, open_browser=False)
    )
    ctx.controller._protocol_factory = lambda **_k: fake
    await ctx.controller.start()
    await ctx.controller.start_pairing("192.168.1.50", 8080, 8000, "TV")
    with pytest.raises(ProtocolError):
        await ctx.controller.confirm_pin("4321")
    await ctx.controller.shutdown()
