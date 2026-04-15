from __future__ import annotations

from pathlib import Path


def _find_api_root(anchor: Path) -> Path:
    for candidate in [anchor.parent, *anchor.parents]:
        if (candidate / "alembic.ini").exists() and (candidate / "pyproject.toml").exists():
            return candidate
    return anchor.parent


API_ROOT = _find_api_root(Path(__file__).resolve())


def _find_workspace_root() -> Path:
    for candidate in [API_ROOT, *API_ROOT.parents]:
        if (candidate / "apps" / "api").exists():
            return candidate
    return API_ROOT


WORKSPACE_ROOT = _find_workspace_root()
