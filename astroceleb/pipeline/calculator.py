"""
Vedic sidereal chart calculator.
Ayanamsa: Lahiri. House system: Whole Sign.
Requires Python 3.11+ and pyswisseph.
"""

from __future__ import annotations

import json
from dataclasses import asdict, dataclass
from datetime import date, datetime, time
from datetime import timezone as dt_timezone
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

import swisseph as swe


# ── constants ──────────────────────────────────────────────────────────────────

SIGN_NAMES: list[str] = [
    "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
    "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
]

# 27 lunar mansions (nakshatras), each spanning 360/27 = 13°20'
NAKSHATRA_NAMES: list[str] = [
    "Ashwini", "Bharani", "Krittika", "Rohini", "Mrigashira", "Ardra",
    "Punarvasu", "Pushya", "Ashlesha", "Magha", "Purva Phalguni",
    "Uttara Phalguni", "Hasta", "Chitra", "Swati", "Vishakha", "Anuradha",
    "Jyeshtha", "Mula", "Purva Ashadha", "Uttara Ashadha", "Shravana",
    "Dhanishtha", "Shatabhisha", "Purva Bhadrapada", "Uttara Bhadrapada", "Revati",
]

# Ordered for deterministic JSON output. Ketu is derived from Rahu, not fetched.
_PLANET_IDS: list[tuple[str, int]] = [
    ("sun",     swe.SUN),
    ("moon",    swe.MOON),
    ("mercury", swe.MERCURY),
    ("venus",   swe.VENUS),
    ("mars",    swe.MARS),
    ("jupiter", swe.JUPITER),
    ("saturn",  swe.SATURN),
    ("rahu",    swe.MEAN_NODE),  # mean lunar north node
]

# FLG_SPEED needed so result[3] carries deg/day for retrograde detection
_CALC_FLAGS = swe.FLG_SIDEREAL | swe.FLG_SPEED


# ── data model ─────────────────────────────────────────────────────────────────

@dataclass
class Placement:
    planet: str
    sign: int               # 1–12 (Aries=1 … Pisces=12)
    sign_name: str
    degree_in_sign: float   # 0.0000–29.9999
    absolute_degree: float  # 0.0000–359.9999
    house: int | None       # 1–12; None when birth time is unknown
    retrograde: bool
    nakshatra: int          # 1–27
    nakshatra_name: str


@dataclass
class ChartResult:
    ayanamsa: str
    house_system: str
    birth_time_known: bool
    ascendant_sign: int | None
    ascendant_sign_name: str | None
    ascendant_degree: float | None       # degree within the rising sign
    ascendant_nakshatra: int | None      # 1–27
    ascendant_nakshatra_name: str | None
    placements: list[Placement]

    def to_dict(self) -> dict:
        return {
            "ayanamsa": self.ayanamsa,
            "house_system": self.house_system,
            "birth_time_known": self.birth_time_known,
            "ascendant": {
                "sign": self.ascendant_sign,
                "sign_name": self.ascendant_sign_name,
                "degree": self.ascendant_degree,
                "nakshatra": self.ascendant_nakshatra,
                "nakshatra_name": self.ascendant_nakshatra_name,
            } if self.birth_time_known else None,
            "placements": [asdict(p) for p in self.placements],
        }

    def to_json(self, indent: int = 2) -> str:
        return json.dumps(self.to_dict(), indent=indent, ensure_ascii=False)


# ── exceptions ─────────────────────────────────────────────────────────────────

class ChartError(Exception):
    """Base class for all chart calculation failures."""


class InvalidTimezoneError(ChartError):
    """Unknown IANA timezone string."""


class InvalidCoordinatesError(ChartError):
    """Latitude or longitude out of valid range."""


class InvalidDateError(ChartError):
    """Cannot construct the requested date/time."""


# ── private helpers ────────────────────────────────────────────────────────────

def _validate_coordinates(lat: float, lng: float) -> None:
    if not -90 <= lat <= 90:
        raise InvalidCoordinatesError(f"Latitude {lat} is outside [-90, 90]")
    if not -180 <= lng <= 180:
        raise InvalidCoordinatesError(f"Longitude {lng} is outside [-180, 180]")


def _to_julian_ut(
    birth_date: date,
    birth_time: time | None,
    timezone_name: str,
) -> float:
    """
    Convert a local birth date/time to a Julian Day Number in Universal Time.

    When birth_time is None we use local noon as a stand-in. The caller is
    responsible for NOT showing the ascendant or house numbers in that case.
    """
    try:
        tz = ZoneInfo(timezone_name)
    except (ZoneInfoNotFoundError, KeyError):
        raise InvalidTimezoneError(f"Unknown timezone: '{timezone_name}'")

    h, m, s = (birth_time.hour, birth_time.minute, birth_time.second) if birth_time else (12, 0, 0)

    try:
        dt_local = datetime(birth_date.year, birth_date.month, birth_date.day, h, m, s, tzinfo=tz)
    except ValueError as exc:
        raise InvalidDateError(str(exc)) from exc

    dt_utc = dt_local.astimezone(dt_timezone.utc)
    ut_hour = dt_utc.hour + dt_utc.minute / 60.0 + dt_utc.second / 3600.0
    return swe.julday(dt_utc.year, dt_utc.month, dt_utc.day, ut_hour)


def _degree_to_sign(degree: float) -> tuple[int, float]:
    """Absolute ecliptic degree → (sign number 1–12, degrees within sign 0–30)."""
    degree = degree % 360.0
    sign = int(degree / 30) + 1
    return sign, degree % 30.0


def _degree_to_nakshatra(absolute_degree: float) -> tuple[int, str]:
    """Absolute sidereal degree → (nakshatra number 1–27, name)."""
    idx = int((absolute_degree % 360.0) / (360.0 / 27))
    return idx + 1, NAKSHATRA_NAMES[idx]


def _whole_sign_house(planet_sign: int, asc_sign: int) -> int:
    """Whole-sign house of a planet given the ascending sign."""
    return ((planet_sign - asc_sign) % 12) + 1


# ── public API ─────────────────────────────────────────────────────────────────

def calculate_chart(
    birth_date: date,
    birth_time: time | None,
    latitude: float,
    longitude: float,
    timezone_name: str = "UTC",
) -> ChartResult:
    """
    Calculate a full Vedic sidereal chart.

    Args:
        birth_date:    Date of birth.
        birth_time:    Local time of birth. Pass None if unknown — ascendant
                       and house numbers will be omitted from the result, but
                       all planetary sign placements are still calculated.
        latitude:      Birth latitude in decimal degrees. North is positive.
        longitude:     Birth longitude in decimal degrees. East is positive.
        timezone_name: IANA timezone (e.g. "America/Los_Angeles", "Asia/Kolkata").
                       Defaults to "UTC".

    Returns:
        ChartResult containing the ascendant and all placements as structured data.

    Raises:
        InvalidCoordinatesError: lat or lng is out of range.
        InvalidTimezoneError:    timezone_name is not a valid IANA key.
        InvalidDateError:        The date/time combination is invalid.
        ChartError:              Any other Swiss Ephemeris failure.
    """
    _validate_coordinates(latitude, longitude)

    # set_sid_mode modifies global state in libswe — call before every calculation
    swe.set_sid_mode(swe.SIDM_LAHIRI, 0, 0)

    birth_time_known = birth_time is not None
    jd = _to_julian_ut(birth_date, birth_time, timezone_name)

    # ── ascendant ──────────────────────────────────────────────────────────────
    # swe.houses() returns tropical cusps; subtract Lahiri ayanamsa for sidereal.
    asc_sign: int | None = None
    asc_sign_name: str | None = None
    asc_degree: float | None = None
    asc_nakshatra: int | None = None
    asc_nakshatra_name: str | None = None

    if birth_time_known:
        try:
            _, ascmc = swe.houses(jd, latitude, longitude, b"W")
        except Exception as exc:
            raise ChartError(f"House calculation failed: {exc}") from exc

        tropical_asc = ascmc[0]
        ayanamsa = swe.get_ayanamsa_ut(jd)
        sidereal_asc = (tropical_asc - ayanamsa) % 360.0

        asc_sign, deg_in_sign = _degree_to_sign(sidereal_asc)
        asc_sign_name = SIGN_NAMES[asc_sign - 1]
        asc_degree = round(deg_in_sign, 4)
        asc_nakshatra, asc_nakshatra_name = _degree_to_nakshatra(sidereal_asc)

    # ── planets ────────────────────────────────────────────────────────────────
    placements: list[Placement] = []

    for planet_name, planet_id in _PLANET_IDS:
        try:
            xx, _ = swe.calc_ut(jd, planet_id, _CALC_FLAGS)
        except Exception as exc:
            raise ChartError(f"Calculation failed for '{planet_name}': {exc}") from exc

        abs_deg = xx[0]   # sidereal longitude (Lahiri applied via FLG_SIDEREAL)
        speed   = xx[3]   # degrees/day; negative = retrograde

        sign, deg_in_sign = _degree_to_sign(abs_deg)
        nak, nak_name = _degree_to_nakshatra(abs_deg)

        placements.append(Placement(
            planet=planet_name,
            sign=sign,
            sign_name=SIGN_NAMES[sign - 1],
            degree_in_sign=round(deg_in_sign, 4),
            absolute_degree=round(abs_deg, 4),
            house=_whole_sign_house(sign, asc_sign) if birth_time_known else None,
            retrograde=speed < 0,
            nakshatra=nak,
            nakshatra_name=nak_name,
        ))

    # ── ketu (South Node = Rahu + 180°) ───────────────────────────────────────
    rahu = next(p for p in placements if p.planet == "rahu")
    ketu_abs = (rahu.absolute_degree + 180.0) % 360.0
    ketu_sign, ketu_deg = _degree_to_sign(ketu_abs)
    ketu_nak, ketu_nak_name = _degree_to_nakshatra(ketu_abs)

    placements.append(Placement(
        planet="ketu",
        sign=ketu_sign,
        sign_name=SIGN_NAMES[ketu_sign - 1],
        degree_in_sign=round(ketu_deg, 4),
        absolute_degree=round(ketu_abs, 4),
        house=_whole_sign_house(ketu_sign, asc_sign) if birth_time_known else None,
        retrograde=True,  # mean node axis is always retrograde
        nakshatra=ketu_nak,
        nakshatra_name=ketu_nak_name,
    ))

    return ChartResult(
        ayanamsa="lahiri",
        house_system="whole_sign",
        birth_time_known=birth_time_known,
        ascendant_sign=asc_sign,
        ascendant_sign_name=asc_sign_name,
        ascendant_degree=asc_degree,
        ascendant_nakshatra=asc_nakshatra,
        ascendant_nakshatra_name=asc_nakshatra_name,
        placements=placements,
    )
