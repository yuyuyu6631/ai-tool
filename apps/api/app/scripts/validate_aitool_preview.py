from __future__ import annotations

import argparse
import csv
import json
import socket
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from urllib import error, request
from urllib.parse import urlparse


_SCRIPT_PATH = Path(__file__).resolve()
_WORKSPACE_ROOT = _SCRIPT_PATH.parents[min(4, len(_SCRIPT_PATH.parents) - 1)]

DEFAULT_MANIFESTS_DIR = (
    _WORKSPACE_ROOT
    / "archive"
    / "drawer"
    / "tooling-assets"
    / "apigetxlsx"
    / "aitool"
    / "manifests"
)
DEFAULT_REPORT_PATH = DEFAULT_MANIFESTS_DIR / "preview_validation_report.json"
DEFAULT_ASSET_SUMMARY_PATH = DEFAULT_MANIFESTS_DIR / "asset_summary.json"
DEFAULT_TOOL_LOGO_REPORT_PATH = DEFAULT_MANIFESTS_DIR / "tool_logo_report.csv"
DEFAULT_DB_IMPORT_PAYLOAD_PATH = DEFAULT_MANIFESTS_DIR / "db_import_payload.json"
DEFAULT_LIMIT = 12
REQUEST_HEADERS = {
    "User-Agent": "XingdianpingPreviewValidator/1.0 (+https://localhost)",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
}
RESTRICTED_STATUS_CODES = {401, 403, 405}


def load_json(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def load_csv(path: Path) -> list[dict[str, str]]:
    with path.open("r", encoding="utf-8", newline="") as handle:
        return list(csv.DictReader(handle))


def looks_like_valid_url(value: str) -> bool:
    parsed = urlparse(value)
    return parsed.scheme in {"http", "https"} and bool(parsed.netloc)


def check_url(url: str, timeout: float) -> dict[str, Any]:
    if not url:
        return {
            "finalUrl": None,
            "urlStatusCode": None,
            "urlCheckStatus": "missing",
            "urlReachable": False,
            "urlError": "missing_url",
            "ready": False,
        }
    if not looks_like_valid_url(url):
        return {
            "finalUrl": None,
            "urlStatusCode": None,
            "urlCheckStatus": "invalid",
            "urlReachable": False,
            "urlError": "invalid_url",
            "ready": False,
        }

    request_obj = request.Request(url, headers=REQUEST_HEADERS)
    try:
        with request.urlopen(request_obj, timeout=timeout) as response:
            status_code = getattr(response, "status", response.getcode())
            final_url = response.geturl()
            check_status = "redirected" if final_url.rstrip("/") != url.rstrip("/") else "ok"
            return {
                "finalUrl": final_url,
                "urlStatusCode": status_code,
                "urlCheckStatus": check_status,
                "urlReachable": True,
                "urlError": None,
                "ready": True,
            }
    except error.HTTPError as exc:
        final_url = exc.geturl() or url
        status_code = exc.code
        reachable = status_code in RESTRICTED_STATUS_CODES
        return {
            "finalUrl": final_url,
            "urlStatusCode": status_code,
            "urlCheckStatus": "restricted" if reachable else "error",
            "urlReachable": reachable,
            "urlError": f"http_{status_code}",
            "ready": reachable,
        }
    except error.URLError as exc:
        reason = exc.reason
        if isinstance(reason, socket.timeout):
            message = "timeout"
        else:
            message = str(reason)
        return {
            "finalUrl": url,
            "urlStatusCode": None,
            "urlCheckStatus": "error",
            "urlReachable": False,
            "urlError": message,
            "ready": False,
        }
    except Exception as exc:  # pragma: no cover - defensive guard for network edge cases
        return {
            "finalUrl": url,
            "urlStatusCode": None,
            "urlCheckStatus": "error",
            "urlReachable": False,
            "urlError": str(exc),
            "ready": False,
        }


def collect_required_field_issues(payload_tool: dict[str, Any]) -> list[str]:
    issues: list[str] = []
    if not payload_tool.get("name"):
        issues.append("missing_name")
    if not payload_tool.get("official_url"):
        issues.append("missing_url")
    elif not looks_like_valid_url(str(payload_tool.get("official_url", ""))):
        issues.append("invalid_url")
    if not payload_tool.get("summary"):
        issues.append("missing_summary")
    if not payload_tool.get("category_name") or payload_tool.get("category_name") == "uncategorized":
        issues.append("missing_category")
    return issues


def collect_warnings(tool_row: dict[str, str], payload_tool: dict[str, Any], url_result: dict[str, Any]) -> list[str]:
    warnings: list[str] = []
    import_meta = payload_tool.get("import_meta", {})
    if tool_row.get("logo_status") != "exact_match":
        warnings.append(f"logo_{tool_row.get('logo_status', 'missing')}")
    if tool_row.get("logo_risk_level") in {"high", "critical"}:
        warnings.append(f"logo_risk_{tool_row.get('logo_risk_level')}")
    if not import_meta.get("platforms") or import_meta.get("platforms") == "未显示":
        warnings.append("platforms_unverified")
    if url_result["urlCheckStatus"] == "redirected":
        warnings.append("url_redirected")
    if url_result["urlCheckStatus"] == "restricted":
        warnings.append("url_restricted")
    return warnings


def build_source_summary(asset_summary: dict[str, Any]) -> dict[str, Any]:
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


def build_stats(items: list[dict[str, Any]], total_rows: int) -> dict[str, int]:
    return {
        "totalRows": total_rows,
        "sampleRows": len(items),
        "importReadyRows": sum(1 for item in items if item["importReady"]),
        "urlReachableRows": sum(1 for item in items if item["urlReachable"]),
        "urlRestrictedRows": sum(1 for item in items if item["urlCheckStatus"] == "restricted"),
        "urlErrorRows": sum(1 for item in items if item["urlCheckStatus"] in {"error", "invalid", "missing"}),
        "highRiskLogoRows": sum(1 for item in items if item["logoRiskLevel"] in {"high", "critical"}),
        "missingRequiredFieldRows": sum(1 for item in items if item["requiredFieldIssues"]),
    }


def build_report(
    asset_summary: dict[str, Any],
    tool_logo_rows: list[dict[str, str]],
    payload: dict[str, Any],
    limit: int,
    timeout: float,
) -> dict[str, Any]:
    tools = payload.get("tools", [])
    items: list[dict[str, Any]] = []

    for row_number, (tool_row, payload_tool) in enumerate(zip(tool_logo_rows[:limit], tools[:limit]), start=2):
        required_field_issues = collect_required_field_issues(payload_tool)
        url_result = check_url(str(payload_tool.get("official_url", "")), timeout=timeout)
        warnings = collect_warnings(tool_row, payload_tool, url_result)
        logo_risk_level = str(tool_row.get("logo_risk_level", "unknown"))

        import_ready = (
            not required_field_issues
            and url_result["ready"]
            and logo_risk_level not in {"high", "critical"}
        )

        items.append(
            {
                "rowNumber": row_number,
                "slug": payload_tool.get("slug", ""),
                "name": payload_tool.get("name", tool_row.get("name", "")),
                "category": payload_tool.get("category_name", ""),
                "summary": payload_tool.get("summary", ""),
                "officialUrl": payload_tool.get("official_url", ""),
                "logoPath": payload_tool.get("logo_path"),
                "finalUrl": url_result["finalUrl"],
                "urlStatusCode": url_result["urlStatusCode"],
                "urlCheckStatus": url_result["urlCheckStatus"],
                "urlReachable": url_result["urlReachable"],
                "urlError": url_result["urlError"],
                "logoRef": tool_row.get("logo_ref", ""),
                "logoStatus": tool_row.get("logo_status", "missing"),
                "logoRiskLevel": logo_risk_level,
                "logoRiskReasons": [item for item in str(tool_row.get("logo_risk_reasons", "")).split("|") if item],
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

    sheets = asset_summary.get("sheets", [])
    primary_sheet = sheets[0] if sheets else {}
    total_rows = int(asset_summary.get("tool_logo_summary", {}).get("tool_rows", len(tool_logo_rows)))

    return {
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "workbookPath": asset_summary.get("workbook_path", ""),
        "sheetTitle": primary_sheet.get("title", ""),
        "sheetHeaders": primary_sheet.get("headers", []),
        "stats": build_stats(items, total_rows=total_rows),
        "sourceSummary": build_source_summary(asset_summary),
        "items": items,
    }


def run(
    asset_summary_path: Path,
    tool_logo_report_path: Path,
    db_import_payload_path: Path,
    output_path: Path,
    limit: int,
    timeout: float,
) -> None:
    asset_summary = load_json(asset_summary_path)
    tool_logo_rows = load_csv(tool_logo_report_path)
    payload = load_json(db_import_payload_path)
    report = build_report(asset_summary, tool_logo_rows, payload, limit=limit, timeout=timeout)
    output_path.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Preview validation report written to: {output_path}")
    print(
        "Validation stats: "
        f"sample={report['stats']['sampleRows']} "
        f"ready={report['stats']['importReadyRows']} "
        f"urlReachable={report['stats']['urlReachableRows']} "
        f"highRiskLogo={report['stats']['highRiskLogoRows']}"
    )


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Validate a small preview batch from the workbook manifests before import."
    )
    parser.add_argument("--asset-summary", type=Path, default=DEFAULT_ASSET_SUMMARY_PATH)
    parser.add_argument("--tool-logo-report", type=Path, default=DEFAULT_TOOL_LOGO_REPORT_PATH)
    parser.add_argument("--payload", type=Path, default=DEFAULT_DB_IMPORT_PAYLOAD_PATH)
    parser.add_argument("--output", type=Path, default=DEFAULT_REPORT_PATH)
    parser.add_argument("--limit", type=int, default=DEFAULT_LIMIT)
    parser.add_argument("--timeout", type=float, default=8.0)
    args = parser.parse_args()
    run(
        asset_summary_path=args.asset_summary.resolve(),
        tool_logo_report_path=args.tool_logo_report.resolve(),
        db_import_payload_path=args.payload.resolve(),
        output_path=args.output.resolve(),
        limit=args.limit,
        timeout=args.timeout,
    )


if __name__ == "__main__":
    main()
