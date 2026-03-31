from __future__ import annotations

import json
from collections import Counter

from app.db.session import SessionLocal
from app.models.models import Tool
from app.services.logo_assets import get_logo_file_path, normalize_logo_path, resolve_logo_status

OVERSIZED_THRESHOLD_BYTES = 200 * 1024


def build_report() -> dict[str, object]:
    missing_files: list[dict[str, str]] = []
    invalid_paths: list[dict[str, str]] = []
    oversized_files: list[dict[str, object]] = []
    status_counter: Counter[str] = Counter()

    with SessionLocal() as session:
        tools = session.query(Tool).order_by(Tool.slug.asc()).all()

    for tool in tools:
        normalized = normalize_logo_path(tool.logo_path)
        status = resolve_logo_status(tool.logo_path)
        status_counter[status] += 1

        if tool.logo_path and normalized != tool.logo_path:
            invalid_paths.append(
                {"slug": tool.slug, "storedPath": str(tool.logo_path), "normalizedPath": str(normalized)}
            )

        if status == "invalid":
            missing_files.append(
                {
                    "slug": tool.slug,
                    "logoPath": normalized or "",
                    "expectedFile": str(get_logo_file_path(normalized or "/logos/")),
                }
            )

        if normalized and status == "matched":
            file_path = get_logo_file_path(normalized)
            size = file_path.stat().st_size
            if size > OVERSIZED_THRESHOLD_BYTES:
                oversized_files.append(
                    {
                        "slug": tool.slug,
                        "logoPath": normalized,
                        "file": str(file_path),
                        "sizeBytes": size,
                    }
                )

    return {
        "totalTools": sum(status_counter.values()),
        "validCount": status_counter["matched"],
        "missingCount": status_counter["missing"],
        "invalidCount": status_counter["invalid"],
        "missingFiles": missing_files,
        "invalidPaths": invalid_paths,
        "oversizedFiles": sorted(oversized_files, key=lambda item: int(item["sizeBytes"]), reverse=True),
    }


def main() -> None:
    report = build_report()
    print(json.dumps(report, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
