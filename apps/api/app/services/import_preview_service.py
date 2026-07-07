from __future__ import annotations

import csv
import json
from pathlib import Path
from typing import Any

from app.services.logo_assets import normalize_logo_path


_SERVICE_PATH = Path(__file__).resolve()
_WORKSPACE_ROOT = _SERVICE_PATH.parents[min(4, len(_SERVICE_PATH.parents) - 1)]

MANIFESTS_DIR = (
    _WORKSPACE_ROOT
    / "archive"
    / "drawer"
    / "tooling-assets"
    / "apigetxlsx"
    / "aitool"
    / "manifests"
)
VALIDATION_REPORT_PATH = MANIFESTS_DIR / "preview_validation_report.json"
ASSET_SUMMARY_PATH = MANIFESTS_DIR / "asset_summary.json"
TOOL_LOGO_REPORT_PATH = MANIFESTS_DIR / "tool_logo_report.csv"
DB_IMPORT_PAYLOAD_PATH = MANIFESTS_DIR / "db_import_payload.json"
FALLBACK_SAMPLE_SIZE = 12


def load_import_preview_validation() -> dict[str, Any]:
    report = _load_json(VALIDATION_REPORT_PATH)
    if report:
        return _attach_logo_paths(report)
    return _attach_logo_paths(_build_fallback_report(limit=FALLBACK_SAMPLE_SIZE))


def _build_fallback_report(limit: int) -> dict[str, Any]:
    asset_summary = _load_json(ASSET_SUMMARY_PATH)
    payload = _load_json(DB_IMPORT_PAYLOAD_PATH)
    tool_rows = _load_csv(TOOL_LOGO_REPORT_PATH)

    sheets = asset_summary.get("sheets", [])
    primary_sheet = sheets[0] if sheets else {}
    payload_tools = payload.get("tools", [])

    items: list[dict[str, Any]] = []
    for index, (tool_row, payload_tool) in enumerate(zip(tool_rows[:limit], payload_tools[:limit]), start=2):
        required_field_issues = _collect_required_field_issues(payload_tool)
        warnings = _collect_warnings(tool_row, payload_tool)
        logo_risk_level = str(tool_row.get("logo_risk_level", "unknown"))
        url_check_status = "pending"
        url_reachable = False
        official_url = str(payload_tool.get("official_url", ""))

        if official_url and official_url.startswith(("http://", "https://")):
            url_check_status = "pending"
        elif official_url:
            required_field_issues.append("invalid_url")
            url_check_status = "invalid"

        import_ready = False

        items.append(
            {
                "rowNumber": index,
                "slug": payload_tool.get("slug", ""),
                "name": payload_tool.get("name", tool_row.get("name", "")),
                "category": payload_tool.get("category_name", ""),
                "summary": payload_tool.get("summary", ""),
                "officialUrl": official_url,
                "logoPath": payload_tool.get("logo_path"),
                "finalUrl": official_url or None,
                "urlStatusCode": None,
                "urlCheckStatus": url_check_status,
                "urlReachable": url_reachable,
                "urlError": None,
                "logoRef": tool_row.get("logo_ref", ""),
                "logoStatus": tool_row.get("logo_status", "missing"),
                "logoRiskLevel": logo_risk_level,
                "logoRiskReasons": _split_pipe_field(tool_row.get("logo_risk_reasons", "")),
                "developer": payload_tool.get("import_meta", {}).get("developer", ""),
                "country": payload_tool.get("import_meta", {}).get("country", ""),
                "city": payload_tool.get("import_meta", {}).get("city", ""),
                "price": payload_tool.get("import_meta", {}).get("price", ""),
                "platforms": payload_tool.get("import_meta", {}).get("platforms", ""),
                "vpnRequired": payload_tool.get("import_meta", {}).get("vpn_required", ""),
                "detailPage": payload_tool.get("import_meta", {}).get("detail_page", ""),
                "parentRecord": payload_tool.get("import_meta", {}).get("parent_record", ""),
                "homepageScreenshot": payload_tool.get("import_meta", {}).get("homepage_screenshot", ""),
                "requiredFieldIssues": sorted(set(required_field_issues)),
                "warnings": sorted(set(warnings)),
                "importReady": import_ready,
            }
        )

    return {
        "generatedAt": "fallback",
        "workbookPath": asset_summary.get("workbook_path", ""),
        "sheetTitle": primary_sheet.get("title", ""),
        "sheetHeaders": primary_sheet.get("headers", []),
        "stats": _build_stats(items, total_rows=int(asset_summary.get("tool_logo_summary", {}).get("tool_rows", len(tool_rows)))),
        "sourceSummary": _build_source_summary(asset_summary),
        "items": items,
    }


def _attach_logo_paths(report: dict[str, Any]) -> dict[str, Any]:
    payload = _load_json(DB_IMPORT_PAYLOAD_PATH)
    tools = payload.get("tools", []) if isinstance(payload, dict) else []
    logo_paths_by_slug = {
        str(tool.get("slug", "")): tool.get("logo_path")
        for tool in tools
        if isinstance(tool, dict) and tool.get("slug")
    }

    items = report.get("items")
    if not isinstance(items, list):
        return report

    normalized_items: list[dict[str, Any]] = []
    for item in items:
        if not isinstance(item, dict):
            normalized_items.append(item)
            continue

        slug = str(item.get("slug", ""))
        normalized = dict(item)
        normalized["logoPath"] = normalize_logo_path(item.get("logoPath") or logo_paths_by_slug.get(slug))
        normalized_items.append(normalized)

    normalized_report = dict(report)
    normalized_report["items"] = normalized_items
    return normalized_report


def _build_stats(items: list[dict[str, Any]], total_rows: int) -> dict[str, int]:
    return {
        "totalRows": total_rows,
        "sampleRows": len(items),
        "importReadyRows": sum(1 for item in items if item["importReady"]),
        "urlReachableRows": sum(1 for item in items if item["urlReachable"]),
        "urlRestrictedRows": sum(1 for item in items if item["urlCheckStatus"] == "restricted"),
        "urlErrorRows": sum(1 for item in items if item["urlCheckStatus"] in {"error", "invalid"}),
        "highRiskLogoRows": sum(1 for item in items if item["logoRiskLevel"] in {"high", "critical"}),
        "missingRequiredFieldRows": sum(1 for item in items if item["requiredFieldIssues"]),
    }


def _build_source_summary(asset_summary: dict[str, Any]) -> dict[str, Any]:
    logo_summary = asset_summary.get("tool_logo_summary", {})
    db_summary = asset_summary.get("db_import_summary", {})
    return {
        "toolRows": int(logo_summary.get("tool_rows", 0)),
        "logoFiles": int(logo_summary.get("logo_files", 0)),
        "placeholderLogoRefs": int(logo_summary.get("placeholder_logo_refs", 0)),
        "missingLogoRefs": int(logo_summary.get("missing_logo_refs", 0)),
        "unresolvedLogoRefs": int(logo_summary.get("unresolved_non_placeholder_logo_refs", 0)),
        "dbImportTools": int(db_summary.get("tools", 0)),
        "dbImportCategories": int(db_summary.get("categories", 0)),
        "dbImportTags": int(db_summary.get("tags", 0)),
    }


def _collect_required_field_issues(payload_tool: dict[str, Any]) -> list[str]:
    issues: list[str] = []
    if not payload_tool.get("name"):
        issues.append("missing_name")
    if not payload_tool.get("official_url"):
        issues.append("missing_url")
    if not payload_tool.get("summary"):
        issues.append("missing_summary")
    if not payload_tool.get("category_name") or payload_tool.get("category_name") == "uncategorized":
        issues.append("missing_category")
    return issues


def _collect_warnings(tool_row: dict[str, Any], payload_tool: dict[str, Any]) -> list[str]:
    warnings: list[str] = []
    import_meta = payload_tool.get("import_meta", {})
    if tool_row.get("logo_status") != "exact_match":
        warnings.append(f"logo_{tool_row.get('logo_status', 'missing')}")
    if not import_meta.get("platforms") or import_meta.get("platforms") == "未显示":
        warnings.append("platforms_unverified")
    return warnings


def _split_pipe_field(value: Any) -> list[str]:
    return [item for item in str(value).split("|") if item]


def _load_json(path: Path) -> dict[str, Any]:
    if not path.exists():
        return {}
    return json.loads(path.read_text(encoding="utf-8"))


def _load_csv(path: Path) -> list[dict[str, str]]:
    if not path.exists():
        return []
    with path.open("r", encoding="utf-8", newline="") as handle:
        return list(csv.DictReader(handle))
