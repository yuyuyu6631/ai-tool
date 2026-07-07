from __future__ import annotations

import json

from sqlalchemy import select

from app.db.session import SessionLocal
from app.models.models import RankingItem, ScenarioTool, Source, Tool, ToolCategory, ToolEmbedding, ToolReview, ToolTag
from app.services.logo_assets import resolve_logo_status


KNOWN_BAD_SLUGS = {"cc-123"}
KNOWN_BAD_NAMES = {"cc", "cc'123"}


def is_bad_tool(tool: Tool) -> bool:
    name = (tool.name or "").strip().casefold()
    summary = (tool.summary or "").strip().casefold()
    slug = (tool.slug or "").strip().casefold()
    if slug in KNOWN_BAD_SLUGS:
        return True
    if name in KNOWN_BAD_NAMES or summary in KNOWN_BAD_NAMES:
        return True
    return bool(name and name == summary and not tool.official_url and not tool.logo_path and tool.score <= 0)


def main() -> None:
    with SessionLocal() as session:
        bad_tools = session.scalars(select(Tool).where(Tool.slug.in_(KNOWN_BAD_SLUGS))).all()
        all_tools = session.scalars(select(Tool)).all()
        bad_ids = {tool.id for tool in bad_tools}
        bad_ids.update(tool.id for tool in all_tools if is_bad_tool(tool))

        delete_counts: dict[str, int] = {}
        for model in (RankingItem, ScenarioTool, Source, ToolEmbedding, ToolReview, ToolCategory, ToolTag):
            if not bad_ids:
                delete_counts[model.__tablename__] = 0
                continue
            rows = session.query(model).filter(model.tool_id.in_(bad_ids)).delete(synchronize_session=False)
            delete_counts[model.__tablename__] = rows

        removed_tools = 0
        if bad_ids:
            removed_tools = session.query(Tool).filter(Tool.id.in_(bad_ids)).delete(synchronize_session=False)

        logo_updates = 0
        for tool in session.scalars(select(Tool)).all():
            next_status = resolve_logo_status(tool.logo_path)
            if tool.logo_status != next_status:
                tool.logo_status = next_status
                logo_updates += 1

        session.commit()

    print(
        json.dumps(
            {
                "removedToolIds": sorted(bad_ids),
                "removedTools": removed_tools,
                "deleteCounts": delete_counts,
                "logoStatusUpdates": logo_updates,
            },
            ensure_ascii=False,
        )
    )


if __name__ == "__main__":
    main()
