"""
Batch chart calculation from a CSV file.

Expected CSV columns (header row required):
  name          – display name                          (required)
  birth_date    – ISO 8601 date, e.g. 1981-09-04        (required)
  latitude      – decimal degrees, north positive       (required)
  longitude     – decimal degrees, east positive        (required)
  slug          – URL slug                              (optional)
  birth_time    – ISO 8601 time, e.g. 09:00:00          (optional; leave blank if unknown)
  timezone_name – IANA string, e.g. America/New_York   (optional; defaults to UTC)

Example:
  name,slug,birth_date,birth_time,latitude,longitude,timezone_name
  Beyoncé,beyonce,1981-09-04,09:00:00,29.7604,-95.3698,America/Chicago
  Elvis Presley,elvis-presley,1935-01-08,,33.5946,-86.8716,America/Chicago
"""

from __future__ import annotations

import csv
import json
from datetime import date, time
from pathlib import Path

from .calculator import ChartError, calculate_chart

_REQUIRED_COLUMNS = {"name", "birth_date", "latitude", "longitude"}

# birth_time_accuracy values the user may supply → Rodden rating equivalent
_ACCURACY_TO_RODDEN = {
    "confirmed": "AA",
    "estimated": "B",
    "unknown":   "X",
}


# ── parsers ────────────────────────────────────────────────────────────────────

def _parse_date(raw: str) -> date:
    return date.fromisoformat(raw.strip())


def _parse_time(raw: str) -> time | None:
    raw = raw.strip()
    return time.fromisoformat(raw) if raw else None


def _parse_float(raw: str, field: str) -> float:
    try:
        return float(raw.strip())
    except ValueError:
        raise ValueError(f"'{field}' must be a number, got: {raw!r}")


# ── public API ─────────────────────────────────────────────────────────────────

def process_csv(
    csv_path: str | Path,
    *,
    stop_on_error: bool = False,
) -> list[dict]:
    """
    Calculate charts for every row in a CSV file.

    Args:
        csv_path:      Path to the input CSV file.
        stop_on_error: When True, re-raise the first row error instead of
                       collecting it. Useful for debugging a single bad row.

    Returns:
        A list of result dicts, one per CSV row, each with the shape::

            {
                "name":    str,
                "slug":    str | None,
                "success": bool,
                "chart":   dict | None,   # ChartResult.to_dict() on success
                "error":   str | None,    # human-readable message on failure
            }
    """
    path = Path(csv_path)
    if not path.is_file():
        raise FileNotFoundError(f"CSV not found: {path}")

    results: list[dict] = []

    with path.open(newline="", encoding="utf-8-sig") as fh:  # utf-8-sig strips Excel BOM
        reader = csv.DictReader(fh)

        fieldnames = set(reader.fieldnames or [])
        missing = _REQUIRED_COLUMNS - fieldnames
        if missing:
            raise ValueError(f"CSV is missing required columns: {sorted(missing)}")

        for row_num, row in enumerate(reader, start=2):  # row 1 = header
            name = row.get("name") or row.get("full_name", "")
            name = name.strip()
            slug = row.get("slug", "").strip() or None

            # Accept either rodden_rating directly or the simplified birth_time_accuracy
            rodden = row.get("rodden_rating", "").strip() or None
            if not rodden:
                accuracy = row.get("birth_time_accuracy", "").strip().lower()
                rodden = _ACCURACY_TO_RODDEN.get(accuracy)

            profession_raw = row.get("profession", "").strip()
            professions = [p.strip() for p in profession_raw.split(",") if p.strip()]

            try:
                chart = calculate_chart(
                    birth_date=_parse_date(row["birth_date"]),
                    birth_time=_parse_time(row.get("birth_time", "")),
                    latitude=_parse_float(row["latitude"], "latitude"),
                    longitude=_parse_float(row["longitude"], "longitude"),
                    timezone_name=row.get("timezone_name", "").strip() or "UTC",
                )
                results.append({
                    "name":        name,
                    "slug":        slug,
                    "professions": professions,
                    "rodden_rating": rodden,
                    "success": True,
                    "chart":   chart.to_dict(),
                    "error":   None,
                })

            except (ChartError, ValueError, KeyError) as exc:
                if stop_on_error:
                    raise
                results.append({
                    "name":          name,
                    "slug":          slug,
                    "professions":   professions,
                    "rodden_rating": rodden,
                    "success":       False,
                    "chart":         None,
                    "error":         f"Row {row_num}: {type(exc).__name__}: {exc}",
                })

    return results


def process_csv_to_json(
    csv_path: str | Path,
    output_path: str | Path | None = None,
    *,
    indent: int = 2,
    stop_on_error: bool = False,
) -> str:
    """
    Process a CSV and serialize results to JSON.

    Args:
        csv_path:      Path to input CSV.
        output_path:   If given, write JSON to this file and return its path.
                       If None, return the JSON string.
        indent:        JSON indentation level.
        stop_on_error: Propagate the first row error instead of collecting it.

    Returns:
        The output file path (as a string) if output_path was given,
        otherwise the JSON string.
    """
    results = process_csv(csv_path, stop_on_error=stop_on_error)
    json_str = json.dumps(results, indent=indent, ensure_ascii=False)

    if output_path is not None:
        out = Path(output_path)
        out.write_text(json_str, encoding="utf-8")
        return str(out)

    return json_str
