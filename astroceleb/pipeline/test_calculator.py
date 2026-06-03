"""
Smoke tests for the chart calculator.
Run with: python -m pytest pipeline/test_calculator.py -v
Requires: pip install pyswisseph tzdata pytest
"""

from datetime import date, time

import pytest

from .calculator import (
    ChartResult,
    InvalidCoordinatesError,
    InvalidTimezoneError,
    Placement,
    calculate_chart,
)

# ── helpers ────────────────────────────────────────────────────────────────────

BEYONCE = dict(
    birth_date=date(1981, 9, 4),
    birth_time=time(9, 0),
    latitude=29.7604,
    longitude=-95.3698,
    timezone_name="America/Chicago",
)


def _placement(result: ChartResult, planet: str) -> Placement:
    return next(p for p in result.placements if p.planet == planet)


# ── structure ──────────────────────────────────────────────────────────────────

def test_returns_chart_result():
    result = calculate_chart(**BEYONCE)
    assert isinstance(result, ChartResult)


def test_planet_count():
    result = calculate_chart(**BEYONCE)
    planets = {p.planet for p in result.placements}
    expected = {"sun", "moon", "mercury", "venus", "mars",
                "jupiter", "saturn", "rahu", "ketu"}
    assert expected == planets


def test_sign_in_range():
    result = calculate_chart(**BEYONCE)
    for p in result.placements:
        assert 1 <= p.sign <= 12, f"{p.planet} sign {p.sign} out of range"


def test_degree_in_range():
    result = calculate_chart(**BEYONCE)
    for p in result.placements:
        assert 0 <= p.degree_in_sign < 30
        assert 0 <= p.absolute_degree < 360


def test_houses_in_range():
    result = calculate_chart(**BEYONCE)
    for p in result.placements:
        assert p.house is not None
        assert 1 <= p.house <= 12


def test_sign_name_matches_sign_number():
    from .calculator import SIGN_NAMES
    result = calculate_chart(**BEYONCE)
    for p in result.placements:
        assert p.sign_name == SIGN_NAMES[p.sign - 1]


def test_ketu_opposite_rahu():
    result = calculate_chart(**BEYONCE)
    rahu = _placement(result, "rahu")
    ketu = _placement(result, "ketu")
    diff = abs(rahu.absolute_degree - ketu.absolute_degree)
    assert abs(diff - 180.0) < 0.01


def test_rahu_ketu_retrograde():
    result = calculate_chart(**BEYONCE)
    assert _placement(result, "rahu").retrograde is True
    assert _placement(result, "ketu").retrograde is True


def test_to_json_is_valid():
    import json
    result = calculate_chart(**BEYONCE)
    parsed = json.loads(result.to_json())
    assert parsed["ayanamsa"] == "lahiri"
    assert parsed["house_system"] == "whole_sign"
    assert isinstance(parsed["placements"], list)
    assert parsed["ascendant"] is not None


# ── missing birth time ─────────────────────────────────────────────────────────

def test_no_birth_time_no_ascendant():
    result = calculate_chart(
        birth_date=date(1981, 9, 4),
        birth_time=None,
        latitude=29.7604,
        longitude=-95.3698,
        timezone_name="America/Chicago",
    )
    assert result.birth_time_known is False
    assert result.ascendant_sign is None
    assert result.ascendant_sign_name is None
    assert result.ascendant_degree is None


def test_no_birth_time_no_houses():
    result = calculate_chart(
        birth_date=date(1981, 9, 4),
        birth_time=None,
        latitude=29.7604,
        longitude=-95.3698,
        timezone_name="America/Chicago",
    )
    for p in result.placements:
        assert p.house is None, f"{p.planet} should have no house"


def test_no_birth_time_still_has_planets():
    result = calculate_chart(
        birth_date=date(1981, 9, 4),
        birth_time=None,
        latitude=29.7604,
        longitude=-95.3698,
        timezone_name="America/Chicago",
    )
    assert len(result.placements) == 9  # 8 planets + ketu


def test_no_birth_time_ascendant_null_in_json():
    import json
    result = calculate_chart(
        birth_date=date(1981, 9, 4),
        birth_time=None,
        latitude=29.7604,
        longitude=-95.3698,
    )
    parsed = json.loads(result.to_json())
    assert parsed["ascendant"] is None


# ── validation errors ──────────────────────────────────────────────────────────

def test_invalid_latitude():
    with pytest.raises(InvalidCoordinatesError):
        calculate_chart(date(1990, 1, 1), time(12, 0), latitude=91.0, longitude=0.0)


def test_invalid_longitude():
    with pytest.raises(InvalidCoordinatesError):
        calculate_chart(date(1990, 1, 1), time(12, 0), latitude=0.0, longitude=200.0)


def test_invalid_timezone():
    with pytest.raises(InvalidTimezoneError):
        calculate_chart(
            date(1990, 1, 1), time(12, 0),
            latitude=0.0, longitude=0.0,
            timezone_name="Not/ATimezone",
        )


def test_default_timezone_utc():
    # Should not raise — UTC is always valid
    result = calculate_chart(date(2000, 6, 21), time(0, 0), 51.5, -0.1)
    assert result.birth_time_known is True


# ── metadata fields ────────────────────────────────────────────────────────────

def test_ayanamsa_field():
    result = calculate_chart(**BEYONCE)
    assert result.ayanamsa == "lahiri"


def test_house_system_field():
    result = calculate_chart(**BEYONCE)
    assert result.house_system == "whole_sign"


# ── nakshatra ──────────────────────────────────────────────────────────────────

def test_nakshatra_in_range():
    result = calculate_chart(**BEYONCE)
    for p in result.placements:
        assert 1 <= p.nakshatra <= 27, f"{p.planet} nakshatra {p.nakshatra} out of 1–27 range"


def test_nakshatra_name_matches_number():
    from .calculator import NAKSHATRA_NAMES
    result = calculate_chart(**BEYONCE)
    for p in result.placements:
        assert p.nakshatra_name == NAKSHATRA_NAMES[p.nakshatra - 1]


def test_ascendant_nakshatra_in_range():
    result = calculate_chart(**BEYONCE)
    assert result.ascendant_nakshatra is not None
    assert 1 <= result.ascendant_nakshatra <= 27


def test_no_birth_time_no_ascendant_nakshatra():
    result = calculate_chart(
        birth_date=date(1981, 9, 4),
        birth_time=None,
        latitude=29.7604,
        longitude=-95.3698,
        timezone_name="America/Chicago",
    )
    assert result.ascendant_nakshatra is None
    assert result.ascendant_nakshatra_name is None


def test_nakshatra_consistent_with_absolute_degree():
    """Each planet's nakshatra number must match its absolute degree bucket."""
    result = calculate_chart(**BEYONCE)
    span = 360.0 / 27
    for p in result.placements:
        expected = int((p.absolute_degree % 360.0) / span) + 1
        assert p.nakshatra == expected, (
            f"{p.planet}: degree {p.absolute_degree:.4f} → expected nak {expected}, got {p.nakshatra}"
        )
