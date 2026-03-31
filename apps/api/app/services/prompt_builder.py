from app.schemas.recommend import RecommendRequest


def build_prompt(payload: RecommendRequest, candidates: list) -> str:
    candidate_lines = [
        f'- slug: {tool.slug}; name: {tool.name}; category: {tool.category}; tags: {", ".join(tool.tags)}; summary: {tool.summary}'
        for tool in candidates
    ]

    return (
        "请根据用户需求，从候选工具中选出最适合的 2 到 3 个工具。\n"
        f"用户需求：{payload.query}\n"
        "候选工具：\n"
        f"{chr(10).join(candidate_lines)}\n\n"
        "只返回 JSON，不要输出额外说明，格式如下：\n"
        '{\n'
        '  "items": [\n'
        '    {"slug": "tool-slug", "reason": "20到40字的中文推荐理由"}\n'
        "  ]\n"
        "}"
    )
