import re

with open("apps/api/app/services/catalog_service.py", "r") as f:
    content = f.read()

# Make sure defaultdict is imported
if "from collections import Counter, defaultdict" not in content:
    content = content.replace("from collections import Counter", "from collections import Counter, defaultdict")

# _build_scenario_summary replacement
content = re.sub(
    r"def _build_scenario_summary\(scenario: Scenario, db\) -> ScenarioSummary:\n\s+# Join with Tool and eager load relationships in one query\n\s+stmt = \(\n\s+select\(ScenarioTool\)\n\s+\.where\(ScenarioTool\.scenario_id == scenario\.id\)\n\s+\.options\(selectinload\(ScenarioTool\.tool\)\.options\(\n\s+selectinload\(Tool\.tags\)\.selectinload\(ToolTag\.tag\),\n\s+selectinload\(Tool\.categories\)\.selectinload\(ToolCategory\.category\),\n\s+\)\)\n\s+\)\n\s+links = db\.scalars\(stmt\)\.all\(\)",
    """def _build_scenario_summary(scenario: Scenario, db, prefetched_links: list[ScenarioTool] | None = None) -> ScenarioSummary:
    # ⚡ Bolt: Use prefetched_links if provided to avoid N+1 queries. O(1) query instead of O(N).
    if prefetched_links is not None:
        links = prefetched_links
    else:
        # Join with Tool and eager load relationships in one query
        stmt = (
            select(ScenarioTool)
            .where(ScenarioTool.scenario_id == scenario.id)
            .options(selectinload(ScenarioTool.tool).options(
                selectinload(Tool.tags).selectinload(ToolTag.tag),
                selectinload(Tool.categories).selectinload(ToolCategory.category),
            ))
        )
        links = db.scalars(stmt).all()""",
    content
)

# list_scenarios replacement
content = re.sub(
    r"rows = db\.scalars\(select\(Scenario\)\.order_by\(Scenario\.id\)\)\.all\(\)\n\s+scenarios = \[\_build_scenario_summary\(row, db\) for row in rows\]",
    """rows = list(db.scalars(select(Scenario).order_by(Scenario.id)).all())

    # ⚡ Bolt: Batch fetch ScenarioTools to eliminate N+1 queries.
    scenario_ids = [row.id for row in rows]
    grouped_links = defaultdict(list)
    if scenario_ids:
        stmt = (
            select(ScenarioTool)
            .where(ScenarioTool.scenario_id.in_(scenario_ids))
            .options(selectinload(ScenarioTool.tool).options(
                selectinload(Tool.tags).selectinload(ToolTag.tag),
                selectinload(Tool.categories).selectinload(ToolCategory.category),
            ))
        )
        all_links = db.scalars(stmt).all()
        for link in all_links:
            grouped_links[link.scenario_id].append(link)

    scenarios = [_build_scenario_summary(row, db, prefetched_links=grouped_links.get(row.id, [])) for row in rows]""",
    content
)

# _build_ranking_section replacement
content = re.sub(
    r"def _build_ranking_section\(ranking: Ranking, db\) -> RankingSection:\n\s+stmt = \(\n\s+select\(RankingItem\)\n\s+\.where\(RankingItem\.ranking_id == ranking\.id\)\n\s+\.order_by\(RankingItem\.rank_order\)\n\s+\.options\(selectinload\(RankingItem\.tool\)\.options\(\n\s+selectinload\(Tool\.tags\)\.selectinload\(ToolTag\.tag\),\n\s+selectinload\(Tool\.categories\)\.selectinload\(ToolCategory\.category\),\n\s+\)\)\n\s+\)\n\s+rows = db\.scalars\(stmt\)\.all\(\)",
    """def _build_ranking_section(ranking: Ranking, db, prefetched_items: list[RankingItem] | None = None) -> RankingSection:
    # ⚡ Bolt: Use prefetched_items if provided to avoid N+1 queries. O(1) query instead of O(N).
    if prefetched_items is not None:
        rows = sorted(prefetched_items, key=lambda i: i.rank_order)
    else:
        stmt = (
            select(RankingItem)
            .where(RankingItem.ranking_id == ranking.id)
            .order_by(RankingItem.rank_order)
            .options(selectinload(RankingItem.tool).options(
                selectinload(Tool.tags).selectinload(ToolTag.tag),
                selectinload(Tool.categories).selectinload(ToolCategory.category),
            ))
        )
        rows = db.scalars(stmt).all()""",
    content
)

# list_rankings replacement
content = re.sub(
    r"rows = db\.scalars\(select\(Ranking\)\.order_by\(Ranking\.id\)\)\.all\(\)\n\s+sections = \[\_build_ranking_section\(row, db\) for row in rows\]",
    """rows = list(db.scalars(select(Ranking).order_by(Ranking.id)).all())

    # ⚡ Bolt: Batch fetch RankingItems to eliminate N+1 queries.
    ranking_ids = [row.id for row in rows]
    grouped_items = defaultdict(list)
    if ranking_ids:
        stmt = (
            select(RankingItem)
            .where(RankingItem.ranking_id.in_(ranking_ids))
            .options(selectinload(RankingItem.tool).options(
                selectinload(Tool.tags).selectinload(ToolTag.tag),
                selectinload(Tool.categories).selectinload(ToolCategory.category),
            ))
        )
        all_items = db.scalars(stmt).all()
        for item in all_items:
            grouped_items[item.ranking_id].append(item)

    sections = [_build_ranking_section(row, db, prefetched_items=grouped_items.get(row.id, [])) for row in rows]""",
    content
)

with open("apps/api/app/services/catalog_service.py", "w") as f:
    f.write(content)
