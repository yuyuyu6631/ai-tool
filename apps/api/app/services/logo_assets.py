from __future__ import annotations

from pathlib import Path

from app.core.paths import WORKSPACE_ROOT


LOGO_STATUS_MATCHED = "matched"
LOGO_STATUS_MISSING = "missing"
LOGO_STATUS_INVALID = "invalid"

LOGO_SOURCE_IMPORTED = "imported"
LOGO_SOURCE_MANUAL = "manual"
LOGO_SOURCE_FALLBACK = "fallback"

LOGO_PUBLIC_DIR = WORKSPACE_ROOT / "apps" / "web" / "public" / "logos"


def normalize_logo_path(value: str | None) -> str | None:
    if not value:
        return None

    trimmed = value.strip()
    if not trimmed:
        return None

    normalized = trimmed.replace("\\", "/")
    filename = normalized.split("/")[-1]
    if not filename:
        return None

    return f"/logos/{filename}"


def resolve_logo_status(value: str | None) -> str:
    normalized = normalize_logo_path(value)
    if not normalized:
        return LOGO_STATUS_MISSING
    if not get_logo_file_path(normalized).exists():
        return LOGO_STATUS_INVALID
    return LOGO_STATUS_MATCHED


def get_logo_file_path(public_path: str) -> Path:
    normalized = normalize_logo_path(public_path)
    if not normalized:
        return LOGO_PUBLIC_DIR
    return LOGO_PUBLIC_DIR / normalized.removeprefix("/logos/")
