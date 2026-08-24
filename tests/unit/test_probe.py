import pytest

from h6400_probe import main


def test_probe_rejects_public_internet_ip(capsys):
    assert main(["--host", "8.8.8.8"]) == 1
    out = capsys.readouterr().out
    assert "FAIL" in out
    assert "public" in out.lower() or "Refusing" in out


def test_probe_rejects_invalid_ip():
    with pytest.raises(SystemExit):
        main([])
