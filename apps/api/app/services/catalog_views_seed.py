from __future__ import annotations

import unicodedata
from dataclasses import dataclass
from datetime import date

from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.models.models import Ranking, RankingItem, Scenario, ScenarioTool, Tool


PUBLIC_TOOL_STATUS = "published"


@dataclass(frozen=True, slots=True)
class RankingSeedDefinition:
    slug: str
    title: str
    description: str
    task_label: str
    category_names: tuple[str, ...]
    keywords: tuple[str, ...]
    size: int = 12


@dataclass(frozen=True, slots=True)
class ScenarioSeedDefinition:
    slug: str
    title: str
    description: str
    problem: str
    target_audience: tuple[str, ...]
    category_names: tuple[str, ...]
    keywords: tuple[str, ...]
    primary_count: int = 3
    alternative_count: int = 2


RANKING_DEFINITIONS: tuple[RankingSeedDefinition, ...] = (
    RankingSeedDefinition(
        slug="top-chat",
        title="AI聊天助手榜",
        description="面向问答、方案梳理和通用协作的聊天类工具榜单。",
        task_label="AI聊天助手",
        category_names=("AI聊天助手",),
        keywords=("chat", "assistant", "copilot", "问答", "聊天", "对话", "知识助手"),
    ),
    RankingSeedDefinition(
        slug="top-writing",
        title="AI写作榜",
        description="聚焦文案、内容创作、邮件和长文整理的写作类工具榜单。",
        task_label="AI写作",
        category_names=("AI写作",),
        keywords=("写作", "文案", "内容", "copy", "marketing", "邮件", "blog"),
    ),
    RankingSeedDefinition(
        slug="top-ppt",
        title="AI PPT制作榜",
        description="适合做提案、汇报和路演材料的演示类工具榜单。",
        task_label="AI PPT制作",
        category_names=("AI PPT制作",),
        keywords=("ppt", "slides", "presentation", "deck", "演示", "汇报", "提案"),
    ),
    RankingSeedDefinition(
        slug="top-coding",
        title="AI代码编程榜",
        description="面向开发、调试、代码生成与工程提效的编程类工具榜单。",
        task_label="AI代码编程",
        category_names=("AI代码编程",),
        keywords=("代码", "编程", "coding", "developer", "debug", "refactor", "engineering"),
    ),
    RankingSeedDefinition(
        slug="top-image",
        title="AI图像榜",
        description="覆盖图片生成、设计出图、海报制作和视觉创作的图像类工具榜单。",
        task_label="AI图像",
        category_names=("AI 图像",),
        keywords=("图像", "图片", "海报", "设计", "image", "poster", "visual", "banner"),
    ),
    RankingSeedDefinition(
        slug="top-video",
        title="AI视频榜",
        description="适合短视频、宣传片和素材生产的视频类工具榜单。",
        task_label="AI视频",
        category_names=("AI 视频",),
        keywords=("视频", "video", "clip", "shorts", "动画", "剪辑", "字幕"),
    ),
    RankingSeedDefinition(
        slug="top-agent",
        title="AI智能体榜",
        description="覆盖 Agent、工作流编排和自动化执行的智能体类工具榜单。",
        task_label="AI智能体",
        category_names=("AI 智能体",),
        keywords=("agent", "workflow", "automation", "智能体", "工作流", "自动化"),
    ),
    RankingSeedDefinition(
        slug="top-data",
        title="AI数据分析榜",
        description="聚焦 BI、报表、分析洞察和数据工作流的数据类工具榜单。",
        task_label="AI数据分析",
        category_names=("AI数据分析",),
        keywords=("数据", "分析", "analytics", "dashboard", "report", "bi", "报表", "洞察"),
    ),
)


SCENARIO_DEFINITIONS: tuple[ScenarioSeedDefinition, ...] = (
    ScenarioSeedDefinition(
        slug="make-ppt",
        title="做PPT用什么AI",
        description="汇报总在最后一晚才开工？先找能把结构、配色和页面一起撑起来的工具，别再从空白页硬抠。",
        problem="汇报和提案通常时间紧，最大的损耗不是内容没有，而是从空白页搭框架和排版太慢。",
        target_audience=("销售", "产品经理", "咨询顾问", "创业者"),
        category_names=("AI PPT制作", "AI写作"),
        keywords=("ppt", "slides", "presentation", "deck", "演示", "汇报", "提案"),
    ),
    ScenarioSeedDefinition(
        slug="write-copy",
        title="写文案用什么AI",
        description="卡在第一句、改到第十版还不满意？先用 AI 铺开方向，再挑那些能稳住语气和转化感的工具。",
        problem="文案工作往往不是没有想法，而是很难持续、稳定地高质量输出多个版本。",
        target_audience=("运营", "市场团队", "内容团队", "独立创作者"),
        category_names=("AI写作", "AI聊天助手"),
        keywords=("文案", "写作", "copy", "marketing", "内容", "创作"),
    ),
    ScenarioSeedDefinition(
        slug="write-email-doc",
        title="写邮件和文档用什么AI",
        description="邮件、方案和说明文档最怕又长又散。优先找能把结构理顺、语气拿捏住的工具。",
        problem="邮件和文档的难点通常在于结构、语气和准确性，而不是单纯把字写出来。",
        target_audience=("产品经理", "销售", "咨询顾问", "企业团队"),
        category_names=("AI文档办公", "AI写作", "AI聊天助手"),
        keywords=("邮件", "文档", "workspace", "docs", "写作", "知识库", "总结"),
    ),
    ScenarioSeedDefinition(
        slug="code-dev",
        title="写代码用什么AI",
        description="你的全天候结对编程搭档。专治写不完的增删改查和复杂正则，重点挑那些读懂上下文、不乱写 Bug 的工具。",
        problem="开发提效的关键不只是补全，而是能不能减少样板代码、查资料和上下文切换。",
        target_audience=("开发者", "技术负责人", "独立开发者", "产品工程团队"),
        category_names=("AI代码编程", "AI聊天助手"),
        keywords=("代码", "编程", "coding", "developer", "copilot", "api", "工程"),
    ),
    ScenarioSeedDefinition(
        slug="debug-refactor",
        title="调试和重构用什么AI",
        description="线上问题一来就头大？先找能读懂旧代码、定位风险、补测试的工具，而不是只会瞎改几行。",
        problem="调试和重构的难点在于理解旧代码和找到真正的风险点，而不是生成几行新代码。",
        target_audience=("开发者", "技术负责人", "测试工程师", "维护团队"),
        category_names=("AI代码编程", "AI聊天助手"),
        keywords=("debug", "调试", "refactor", "重构", "test", "bug", "review"),
    ),
    ScenarioSeedDefinition(
        slug="make-poster",
        title="做海报和配图用什么AI",
        description="海报、封面和配图最怕赶时间还要反复返工。优先选那些出图快、风格稳、改图不折腾的工具。",
        problem="视觉物料常常要在很短时间内产出多个版本，纯手工设计成本高、返工也重。",
        target_audience=("设计师", "运营", "市场团队", "电商团队"),
        category_names=("AI 图像",),
        keywords=("海报", "配图", "设计", "banner", "poster", "visual", "图像"),
    ),
    ScenarioSeedDefinition(
        slug="make-video",
        title="做视频用什么AI",
        description="短视频不是剪完就行，脚本、素材、配音都在耗时间。先挑能把整条链路串起来的工具。",
        problem="视频生产链路长，脚本、素材、配音和剪辑往往分散在多个工具里，流程很碎。",
        target_audience=("内容团队", "品牌团队", "短视频运营", "创作者"),
        category_names=("AI 视频", "AI 音频·音乐"),
        keywords=("视频", "video", "clip", "shorts", "动画", "剪辑", "配音"),
    ),
    ScenarioSeedDefinition(
        slug="meeting-summary",
        title="会议记录整理用什么AI",
        description="会开完最累的不是记下来，而是会后没人看。优先找能把纪要、待办和结论一次整理清楚的工具。",
        problem="会议记录的核心痛点不是记下来，而是会后如何快速整理、提炼结论并同步团队。",
        target_audience=("产品经理", "运营", "项目经理", "企业团队"),
        category_names=("AI记录摘要", "AI文档办公", "AI聊天助手"),
        keywords=("会议", "纪要", "记录", "summary", "notes", "transcript", "摘要"),
    ),
    ScenarioSeedDefinition(
        slug="data-analysis",
        title="做数据分析和报表用什么AI",
        description="报表能做，结论却总说不明白？先找能读懂数据、给出图表和结论草稿的工具。",
        problem="数据工作往往卡在分析思路、报表制作和结论表达，而不是拿不到数据本身。",
        target_audience=("运营", "分析师", "产品经理", "业务负责人"),
        category_names=("AI数据分析", "AI文档办公"),
        keywords=("数据", "分析", "analytics", "dashboard", "report", "bi", "报表", "洞察"),
    ),
    ScenarioSeedDefinition(
        slug="build-agent",
        title="搭建智能体和工作流用什么AI",
        description="想把重复活自动跑起来，就别只看会聊天的模型。优先挑能接知识库、编排流程、稳定执行的工具。",
        problem="团队真正需要的不是单次回答，而是把重复任务串成能稳定复用的自动化流程。",
        target_audience=("开发者", "自动化团队", "创业者", "产品团队"),
        category_names=("AI 智能体", "AI代码编程"),
        keywords=("agent", "workflow", "automation", "智能体", "工作流", "自动化"),
    ),
)


RANKING_ORDER = {definition.slug: index for index, definition in enumerate(RANKING_DEFINITIONS)}
SCENARIO_ORDER = {definition.slug: index for index, definition in enumerate(SCENARIO_DEFINITIONS)}
SCENARIO_TARGET_AUDIENCE = {
    definition.slug: list(definition.target_audience) for definition in SCENARIO_DEFINITIONS
}


def _normalize_text(value: str | None) -> str:
    if not value:
        return ""
    normalized = unicodedata.normalize("NFKC", value).casefold().strip()
    return " ".join(normalized.split())


def _compact_text(value: str | None) -> str:
    return "".join(ch for ch in _normalize_text(value) if not ch.isspace())


def _tool_blob(tool: Tool) -> str:
    return " ".join(
        part
        for part in (
            _normalize_text(tool.slug),
            _normalize_text(tool.name),
            _normalize_text(tool.category_name),
            _normalize_text(tool.summary),
            _normalize_text(tool.description),
        )
        if part
    )


def _sort_key(tool: Tool) -> tuple[int, float, int, int, int]:
    last_verified = tool.last_verified_at.toordinal() if isinstance(tool.last_verified_at, date) else 0
    created_on = tool.created_on.toordinal() if isinstance(tool.created_on, date) else 0
    return (
        0 if tool.featured else 1,
        -(tool.score or 0.0),
        -last_verified,
        -created_on,
        tool.id,
    )


def _category_matches(tool: Tool, category_names: tuple[str, ...]) -> bool:
    tool_category = _compact_text(tool.category_name)
    return any(tool_category == _compact_text(category_name) for category_name in category_names)


def _keyword_matches(tool: Tool, keywords: tuple[str, ...]) -> bool:
    blob = _tool_blob(tool)
    compact_blob = _compact_text(blob)
    return any(
        keyword
        and (_normalize_text(keyword) in blob or _compact_text(keyword) in compact_blob)
        for keyword in keywords
    )


def _dedupe_tools(tools: list[Tool]) -> list[Tool]:
    seen_ids: set[int] = set()
    result: list[Tool] = []
    for tool in tools:
        if tool.id in seen_ids:
            continue
        seen_ids.add(tool.id)
        result.append(tool)
    return result


def _select_tools(
    tools: list[Tool],
    *,
    category_names: tuple[str, ...],
    keywords: tuple[str, ...],
    limit: int,
) -> list[Tool]:
    exact = sorted((tool for tool in tools if _category_matches(tool, category_names)), key=_sort_key)
    fallback = sorted(
        (
            tool
            for tool in tools
            if tool.id not in {item.id for item in exact} and _keyword_matches(tool, keywords)
        ),
        key=_sort_key,
    )
    return _dedupe_tools([*exact, *fallback])[:limit]


def get_scenario_target_audience(slug: str) -> list[str]:
    return SCENARIO_TARGET_AUDIENCE.get(slug, [])


def sort_ranking_sections(sections):
    return sorted(sections, key=lambda item: RANKING_ORDER.get(item.slug, len(RANKING_ORDER)))


def sort_scenario_sections(sections):
    return sorted(sections, key=lambda item: SCENARIO_ORDER.get(item.slug, len(SCENARIO_ORDER)))


def seed_catalog_views(db: Session) -> tuple[int, int]:
    tools = db.scalars(select(Tool).where(Tool.status == PUBLIC_TOOL_STATUS)).all()

    for definition in RANKING_DEFINITIONS:
        ranking = db.scalar(select(Ranking).where(Ranking.slug == definition.slug))
        if ranking is None:
            ranking = Ranking(
                slug=definition.slug,
                title=definition.title,
                description=definition.description,
            )
            db.add(ranking)
            db.flush()
        else:
            ranking.title = definition.title
            ranking.description = definition.description

        selected_tools = _select_tools(
            tools,
            category_names=definition.category_names,
            keywords=definition.keywords,
            limit=definition.size,
        )

        db.execute(delete(RankingItem).where(RankingItem.ranking_id == ranking.id))
        db.flush()

        for rank_order, tool in enumerate(selected_tools, start=1):
            db.add(
                RankingItem(
                    ranking_id=ranking.id,
                    tool_id=tool.id,
                    rank_order=rank_order,
                    reason=f"适合{definition.task_label}场景，综合表现靠前",
                )
            )

    for definition in SCENARIO_DEFINITIONS:
        scenario = db.scalar(select(Scenario).where(Scenario.slug == definition.slug))
        if scenario is None:
            scenario = Scenario(
                slug=definition.slug,
                title=definition.title,
                description=definition.description,
                problem=definition.problem,
                tool_count=0,
            )
            db.add(scenario)
            db.flush()
        else:
            scenario.title = definition.title
            scenario.description = definition.description
            scenario.problem = definition.problem

        selected_tools = _select_tools(
            tools,
            category_names=definition.category_names,
            keywords=definition.keywords,
            limit=definition.primary_count + definition.alternative_count,
        )
        primary_tools = selected_tools[: definition.primary_count]
        alternative_tools = selected_tools[definition.primary_count : definition.primary_count + definition.alternative_count]
        scenario.tool_count = len(primary_tools) + len(alternative_tools)

        db.execute(delete(ScenarioTool).where(ScenarioTool.scenario_id == scenario.id))
        db.flush()

        for tool in primary_tools:
            db.add(ScenarioTool(scenario_id=scenario.id, tool_id=tool.id, is_primary=True))
        for tool in alternative_tools:
            db.add(ScenarioTool(scenario_id=scenario.id, tool_id=tool.id, is_primary=False))

    return len(RANKING_DEFINITIONS), len(SCENARIO_DEFINITIONS)
