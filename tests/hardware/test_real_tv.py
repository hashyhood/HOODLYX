"""Physical television tests. Skipped unless H6400_TV_HOST is set.

Never mark these passed without running against the real UA55H6400.
"""

from __future__ import annotations

import os

import pytest

pytestmark = pytest.mark.hardware

HOST = os.environ.get("H6400_TV_HOST")


@pytest.mark.skipif(not HOST, reason="H6400_TV_HOST not set; physical TV not available")
def test_probe_against_real_television() -> None:
    pytest.skip("Run: python tools/h6400_probe.py --host $H6400_TV_HOST")
