from app.schemas.recommend import RecommendRequest
from app.services.catalog_service import list_tools_raw


def select_candidates(payload: RecommendRequest):
    tools = list_tools_raw()
    filtered = tools

    if payload.candidateSlugs:
        allowed = set(payload.candidateSlugs)
        filtered = [tool for tool in filtered if tool.slug in allowed]

    if payload.tags:
        wanted = set(payload.tags)
        filtered = [tool for tool in filtered if wanted.intersection(tool.tags)]

    if payload.scenario:
        lowered = payload.scenario.lower()
        filtered = [tool for tool in filtered if lowered in tool.category.lower() or lowered in tool.summary.lower()]

    return filtered or tools
