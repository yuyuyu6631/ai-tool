from pathlib import Path

from app.services.logo_assets import get_logo_file_path, normalize_logo_path, resolve_logo_status


def test_normalize_logo_path_extracts_public_logo_path():
    assert normalize_logo_path(r"aitool\source\logos\log图包\chatgpt.png") == "/logos/chatgpt.png"


def test_normalize_logo_path_preserves_empty_values():
    assert normalize_logo_path(None) is None
    assert normalize_logo_path("   ") is None


def test_resolve_logo_status_marks_missing_for_empty_path():
    assert resolve_logo_status(None) == "missing"


def test_get_logo_file_path_points_to_public_logos():
    file_path = get_logo_file_path("/logos/chatgpt.png")
    assert isinstance(file_path, Path)
    assert "public" in str(file_path)
