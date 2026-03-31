from pathlib import Path

from app.scripts.organize_aitool_assets import build_import_payload, build_tool_logo_report


def make_row(name: str, logo_ref: str, developer: str = "", url: str = "") -> dict[str, str]:
    return {
        "name": name,
        "logo_ref": logo_ref,
        "developer": developer,
        "country": "",
        "city": "",
        "subtitle": "",
        "homepage_screenshot": "",
        "price": "",
        "price_screenshot": "",
        "special_tags": "",
        "tags": "",
        "platforms": "",
        "vpn_required": "",
        "url": url,
        "remark": "",
        "detail_page": "",
        "parent_record": "",
    }


def touch(path: Path) -> None:
    path.write_bytes(b"test")


def test_build_tool_logo_report_flags_missing_placeholder_and_suspicious_matches(tmp_path: Path):
    touch(tmp_path / "chatgpt.png")
    touch(tmp_path / "claude.png")
    touch(tmp_path / "midjourney.png")

    rows = [
        make_row("Unknown Tool", "", developer="OpenAI", url="https://example.com"),
        make_row("Claude", "image.png", developer="Anthropic", url="https://claude.ai"),
        make_row("ChatGPT", "midjourney.png", developer="OpenAI", url="https://chatgpt.com"),
    ]

    summary, report_rows = build_tool_logo_report(rows, tmp_path)

    assert summary["missing_logo_refs"] == 1
    assert summary["auto_logo_matches"] == 1
    assert summary["high_risk_logo_rows"] >= 2

    missing_row = report_rows[0]
    auto_match_row = report_rows[1]
    suspicious_row = report_rows[2]

    assert missing_row["logo_status"] == "missing"
    assert missing_row["logo_risk_level"] == "critical"

    assert auto_match_row["logo_status"] == "auto_match"
    assert auto_match_row["matched_logo"] == "claude.png"
    assert auto_match_row["logo_risk_level"] in {"low", "medium"}

    assert suspicious_row["logo_status"] == "exact_match"
    assert suspicious_row["matched_logo"] == "midjourney.png"
    assert suspicious_row["logo_risk_level"] in {"high", "critical"}
    assert suspicious_row["better_logo_candidate"] == "chatgpt.png"


def test_build_import_payload_uses_auto_matched_logo(tmp_path: Path):
    logo_dir = tmp_path / "archive" / "drawer" / "tooling-assets" / "apigetxlsx" / "aitool" / "source" / "logos" / "log图包"
    logo_dir.mkdir(parents=True)
    touch(logo_dir / "shipable.png")

    payload = build_import_payload(
        [make_row("Shipable", "image.png", developer="Shipable", url="https://www.shipable.ai/")],
        logo_dir,
    )

    assert payload["tools"][0]["logo_path"] == "aitool/source/logos/log图包/shipable.png"
