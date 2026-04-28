from __future__ import annotations

import hashlib
import json
import re
import time
import unicodedata
from concurrent.futures import ThreadPoolExecutor, TimeoutError
from urllib import error as url_error, request

from app.core.config import settings
from app.schemas.ai_search import (
    AiPanel,
    AiQuickAction,
    AiQuickActionPayload,
    AiSearchMeta,
    AiSearchResponse,
    AiSearchResult,
)
from app.schemas.catalog import ToolsDirectoryResponse
from app.schemas.tool import ToolSummary
from app.services import catalog_service
from app.services.cache_service import get_redis_client, mark_redis_unavailable

INTENT_CACHE_PREFIX = "ai-search:intent"
HOT_QUERY_TTL_SECONDS = 24 * 60 * 60
DEFAULT_QUERY_TTL_SECONDS = 60 * 60
INTENT_TIMEOUT_SECONDS = 1.8
AI_SEARCH_CANDIDATE_LIMIT = 5000

BUSINESS_MAPPINGS = {
    "写论文": "academic-writing 论文 学术 写作 文档 润色 查重 总结",
    "论文": "academic-writing 论文 学术 写作 文档 润色 查重 总结",
    "做 ppt": "presentation ppt 演示 答辩 汇报 幻灯片 设计",
    "做ppt": "presentation ppt 演示 答辩 汇报 幻灯片 设计",
    "ppt": "presentation ppt 演示 答辩 汇报 幻灯片 设计",
    "演示文稿": "presentation ppt 演示 答辩 汇报 幻灯片 设计",
    "幻灯片": "presentation ppt 演示 答辩 汇报 幻灯片 设计",
    "写代码": "coding 代码 编程 开发 debug 测试 接口 前端 后端",
    "代码": "coding 代码 编程 开发 debug 测试 接口 前端 后端",
    "编程": "coding 代码 编程 开发 debug 测试 接口 前端 后端",
    "生成图片": "image-video 图片 绘图 海报 修图 视频 生成图",
    "图片视频": "image-video 图片 绘图 海报 修图 视频 生成图",
    "图片": "image-video 图片 绘图 海报 修图 视频 生成图",
    "办公提效": "office-productivity 表格 会议 纪要 文档 自动化",
    "数据分析": "data-analysis 数据 bi sql 报表 可视化 分析",
    "agent": "agent Agent 自动化 工作流 智能体 插件 任务执行",
    "智能体": "agent Agent 自动化 工作流 智能体 插件 任务执行",
    "写周报": "report-writing 周报 写作 文档 总结",
    "周报": "report-writing 周报 写作 文档 总结",
    "写公众号": "wechat-writing 公众号 写作 润色",
    "公众号": "wechat-writing 公众号 写作 润色",
    "视频剪辑": "video-editing 视频 剪辑 生成",
}

TASK_KEYWORDS = {
    "academic-writing": {"论文", "学术", "写作", "文档", "润色", "查重", "总结"},
    "presentation": {"ppt", "演示", "答辩", "汇报", "幻灯片", "设计", "presentation", "slides"},
    "coding": {"代码", "编程", "开发", "debug", "测试", "接口", "前端", "后端"},
    "image-video": {"图片", "绘图", "海报", "修图", "视频", "生成图"},
    "office-productivity": {"表格", "会议", "纪要", "文档", "自动化"},
    "data-analysis": {"数据", "bi", "sql", "报表", "可视化", "分析"},
    "agent": {"agent", "自动化", "工作流", "智能体", "插件", "任务执行"},
}

TOOL_ALIASES = {
    "chatgpt": {"gpt", "openai", "chat gpt", "论文", "写作", "总结"},
    "claude": {"长文", "写作", "文档", "分析"},
    "gamma": {"ppt", "presentation", "slides", "幻灯片", "演示", "答辩", "汇报"},
    "canva": {"canva", "海报", "设计", "ppt", "图片"},
    "canva-ai": {"canva", "海报", "设计", "ppt", "图片"},
    "cursor": {"ide", "代码", "编程", "开发", "debug"},
    "github-copilot": {"copilot", "代码", "编程", "补全"},
    "midjourney": {"mj", "图片", "绘图", "海报", "生成图"},
    "runway": {"视频", "剪辑", "生成视频"},
    "dify": {"agent", "智能体", "工作流", "自动化"},
    "coze": {"扣子", "agent", "智能体", "国内", "工作流"},
    "deepseek": {"国内", "中文", "免费", "代码"},
}

STOP_WORDS = {
    "帮我",
    "帮忙",
    "请帮我",
    "我想",
    "想找",
    "有没有",
    "一下",
    "工具",
    "ai",
    "用",
}

HOT_QUERY_KEYWORDS = {
    "ppt",
    "presentation",
    "周报",
    "视频剪辑",
    "图片生成",
    "写论文",
    "做ppt",
    "做PPT",
    "写代码",
    "生成图片",
    "数据分析",
    "思维导图",
}

INTENT_PROMPT = """
你是一个 AI 搜索意图解析器，不是聊天助手。
任务：把用户输入的找工具需求转换成结构化 JSON。
要求：
1) 只输出 JSON
2) 不输出 markdown
3) 不杜撰工具名称
4) intent_summary 不超过 40 字
5) quick_actions 最多 3 个
6) constraints 仅可包含 pricing/language/difficulty/platform

输出 JSON 结构：
{
  "intent_summary": "",
  "task": "",
  "category_hint": "",
  "constraints": {
    "pricing": "",
    "language": "",
    "difficulty": "",
    "platform": ""
  },
  "quick_actions": [
    {"label": "", "type": "set_filter", "key": "pricing", "value": "free"}
  ]
}
""".strip()


def _normalize_chat_url(base_url: str) -> str:
    normalized = base_url.rstrip("/")
    if normalized.endswith("/chat/completions"):
        return normalized
    if normalized.endswith("/v1") or normalized.endswith("/v3"):
        return f"{normalized}/chat/completions"
    return f"{normalized}/v1/chat/completions"


def _extract_json_block(content: str) -> dict | None:
    if not content:
        return None

    fenced_match = re.search(r"```(?:json)?\s*(\{[\s\S]*?\})\s*```", content, re.DOTALL)
    if fenced_match:
        try:
            return json.loads(fenced_match.group(1))
        except json.JSONDecodeError:
            pass

    raw_text = content.strip()
    brace_match = re.search(r"(\{[\s\S]*\})", raw_text, re.DOTALL)
    if not brace_match:
        return None

    raw_json = brace_match.group(1)
    try:
        return json.loads(raw_json)
    except json.JSONDecodeError:
        cleaned = re.sub(r",\s*([\]}])", r"\1", raw_json)
        try:
            return json.loads(cleaned)
        except json.JSONDecodeError:
            return None


def normalize_query(query: str) -> str:
    normalized = unicodedata.normalize("NFKC", query).strip()
    normalized = re.sub(r"\s+", " ", normalized)
    lowered = normalized.lower()
    expanded: list[str] = [lowered]
    for source, target in BUSINESS_MAPPINGS.items():
        if source.lower() in lowered:
            expanded.append(target.lower())

    expanded_text = " ".join(expanded)
    tokens = [token for token in re.split(r"[\s,，。！？!?.]+", expanded_text) if token and token not in STOP_WORDS]
    return " ".join(tokens).strip() or normalized


def _build_intent_cache_key(normalized_query: str) -> str:
    payload = json.dumps({"mode": "ai", "query": normalized_query}, ensure_ascii=False, sort_keys=True)
    digest = hashlib.sha256(payload.encode("utf-8")).hexdigest()
    return f"{INTENT_CACHE_PREFIX}:{digest}"


def _cache_ttl_for_query(normalized_query: str) -> int:
    if any(keyword in normalized_query for keyword in HOT_QUERY_KEYWORDS):
        return HOT_QUERY_TTL_SECONDS
    return DEFAULT_QUERY_TTL_SECONDS


def _has_llm_config() -> bool:
    return bool(settings.ai_api_key and settings.ai_model and settings.ai_openai_base_url)


def _build_default_intent(user_query: str, normalized_query: str) -> tuple[dict, str]:
    constraints: dict[str, str] = {}
    logic: list[str] = []

    if "free" in normalized_query or "免费" in normalized_query:
        constraints["pricing"] = "free_preferred"
        logic.append("免费优先")
    if "新手" in normalized_query or "beginner" in normalized_query:
        constraints["difficulty"] = "beginner"
        logic.append("新手友好")
    if "中文" in normalized_query or "zh" in normalized_query:
        constraints["language"] = "zh_preferred"
        logic.append("中文优先")
    if "国内" in normalized_query or "不用 vpn" in normalized_query or "无需 vpn" in normalized_query:
        constraints["access"] = "domestic_preferred"
        logic.append("国内可访问优先")
    if "presentation" in normalized_query:
        logic.append("PPT / 演示场景")
    if "video" in normalized_query or "视频" in normalized_query:
        logic.append("视频处理场景")

    task = "general"
    for candidate in ("academic-writing", "presentation", "coding", "image-video", "office-productivity", "data-analysis", "agent"):
        if candidate in normalized_query:
            task = candidate
            break
    if task == "general":
        if "report" in normalized_query or "周报" in normalized_query:
            task = "report-writing"
        elif "video" in normalized_query or "视频" in normalized_query:
            task = "video-editing"

    actions: list[dict[str, str]] = [
        {"label": "只看免费", "type": "set_filter", "key": "pricing", "value": "free"},
        {"label": "只看中文", "type": "set_filter", "key": "language", "value": "zh"},
        {"label": "进入筛选列表", "type": "view_switch", "value": "filters"},
    ]

    summary = f"用户希望按“{task}”任务快速筛选工具"
    return {
        "intent_summary": summary[:40],
        "task": task,
        "category_hint": "",
        "constraints": constraints,
        "quick_actions": actions,
    }, "fallback"


def _call_intent_llm(query: str, normalized_query: str) -> dict | None:
    body = {
        "model": settings.ai_model,
        "messages": [
            {"role": "system", "content": INTENT_PROMPT},
            {
                "role": "user",
                "content": json.dumps(
                    {
                        "query": query,
                        "normalized_query": normalized_query,
                        "allowed_constraint_values": {
                            "pricing": ["free", "free_preferred", "subscription", "contact"],
                            "language": ["zh", "zh_preferred", "en"],
                            "difficulty": ["beginner", "intermediate", "advanced"],
                            "platform": ["web", "windows", "mac", "ios", "android"],
                        },
                    },
                    ensure_ascii=False,
                ),
            },
        ],
        "temperature": 0,
        "max_tokens": 300,
        "response_format": {"type": "json_object"},
    }

    api_request = request.Request(
        _normalize_chat_url(settings.ai_openai_base_url),
        data=json.dumps(body).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {settings.ai_api_key}",
            "Content-Type": "application/json",
        },
        method="POST",
    )

    with request.urlopen(api_request, timeout=INTENT_TIMEOUT_SECONDS) as response:
        payload = json.loads(response.read().decode("utf-8"))

    choices = payload.get("choices", [])
    if not choices:
        return None

    message = choices[0].get("message", {})
    content = message.get("content") or message.get("reasoning_content") or ""
    if isinstance(content, list):
        parts = [item.get("text", "") for item in content if isinstance(item, dict)]
        content = "\n".join(parts)

    return _extract_json_block(content) if isinstance(content, str) else None


def _normalize_quick_actions(raw_actions: object) -> list[dict]:
    if not isinstance(raw_actions, list):
        return []

    normalized: list[dict] = []
    for item in raw_actions[:3]:
        if not isinstance(item, dict):
            continue
        label = item.get("label")
        action_type = item.get("type")
        if not isinstance(label, str) or not label.strip() or not isinstance(action_type, str) or not action_type.strip():
            continue

        action = {"label": label.strip(), "type": action_type.strip()}
        if isinstance(item.get("key"), str):
            action["key"] = item.get("key").strip()
        if isinstance(item.get("value"), str):
            action["value"] = item.get("value").strip()
        normalized.append(action)

    return normalized


def _normalize_intent_payload(raw_intent: dict, user_query: str, normalized_query: str) -> dict:
    fallback_intent, _ = _build_default_intent(user_query, normalized_query)
    if not isinstance(raw_intent, dict):
        return fallback_intent

    constraints_raw = raw_intent.get("constraints")
    constraints = {}
    if isinstance(constraints_raw, dict):
        for key in ("pricing", "language", "difficulty", "platform", "access"):
            value = constraints_raw.get(key)
            if isinstance(value, str) and value.strip():
                constraints[key] = value.strip()

    summary = raw_intent.get("intent_summary")
    if not isinstance(summary, str) or not summary.strip():
        summary = fallback_intent["intent_summary"]

    quick_actions = _normalize_quick_actions(raw_intent.get("quick_actions"))
    if not quick_actions:
        quick_actions = fallback_intent["quick_actions"]

    return {
        "intent_summary": summary.strip()[:40],
        "task": str(raw_intent.get("task") or fallback_intent["task"]),
        "category_hint": str(raw_intent.get("category_hint") or ""),
        "constraints": constraints,
        "quick_actions": quick_actions,
    }


def parse_ai_search_intent(query: str, normalized_query: str) -> tuple[dict, str, bool]:
    redis_client = get_redis_client()
    cache_key = _build_intent_cache_key(normalized_query)

    if redis_client:
        try:
            cached = redis_client.get(cache_key)
            if cached:
                return json.loads(cached), "cache", True
        except Exception as exc:
            mark_redis_unavailable(exc)

    intent_payload, source = _build_default_intent(query, normalized_query)
    if _has_llm_config():
        try:
            llm_payload = _call_intent_llm(query, normalized_query)
            if llm_payload:
                intent_payload = _normalize_intent_payload(llm_payload, query, normalized_query)
                source = "llm"
        except (url_error.URLError, TimeoutError, ValueError, json.JSONDecodeError, OSError):
            source = "fallback"

    if redis_client:
        try:
            redis_client.setex(cache_key, _cache_ttl_for_query(normalized_query), json.dumps(intent_payload, ensure_ascii=False))
        except Exception as exc:
            mark_redis_unavailable(exc)

    return intent_payload, source, False


def _build_quick_actions(raw_actions: list[dict]) -> list[AiQuickAction]:
    quick_actions: list[AiQuickAction] = []
    for item in raw_actions[:3]:
        action = AiQuickAction(
            label=item.get("label", "快捷动作"),
            action=AiQuickActionPayload(
                type=item.get("type", "set_filter"),
                key=item.get("key"),
                value=item.get("value"),
            ),
        )
        quick_actions.append(action)
    return quick_actions


def _build_active_logic(intent_constraints: dict[str, str], category_hint: str, task: str) -> list[str]:
    logic: list[str] = []
    if task and task != "general":
        logic.append(f"任务: {task}")
    if category_hint:
        logic.append(f"场景: {category_hint}")

    mapping = {
        "pricing": "免费优先" if intent_constraints.get("pricing") in {"free", "free_preferred"} else None,
        "language": "中文优先" if intent_constraints.get("language") in {"zh", "zh_preferred"} else None,
        "difficulty": "新手友好" if intent_constraints.get("difficulty") == "beginner" else None,
        "platform": f"平台: {intent_constraints.get('platform')}" if intent_constraints.get("platform") else None,
        "access": "国内可访问优先" if intent_constraints.get("access") == "domestic_preferred" else None,
    }
    logic.extend([value for value in mapping.values() if value])

    if not logic:
        logic.append("按关键词和基础筛选返回结果")

    return logic[:4]


def _text_contains_any(text: str, terms: set[str] | list[str]) -> bool:
    lowered = text.lower()
    return any(term and term.lower() in lowered for term in terms)


def _tool_field_text(tool: ToolSummary, fields: tuple[str, ...]) -> str:
    values: list[str] = []
    for field in fields:
        value = getattr(tool, field)
        if isinstance(value, list):
            values.extend(str(item) for item in value)
        elif value is not None:
            values.append(str(value))
    return " ".join(values)


def _tokenize_search_text(normalized_query: str) -> list[str]:
    tokens = [token for token in re.split(r"[\s,，。！？!?.、/]+", normalized_query.lower()) if token]
    return [token for token in tokens if token not in STOP_WORDS and len(token) > 1]


def _score_tool(tool: ToolSummary, normalized_query: str, intent_constraints: dict[str, str], task: str) -> int:
    tokens = _tokenize_search_text(normalized_query)
    if not tokens and not intent_constraints:
        return 0

    name_alias = " ".join([tool.name, tool.slug, *TOOL_ALIASES.get(tool.slug, set())]).lower()
    best_for_text = _tool_field_text(tool, ("bestFor",)).lower()
    feature_text = _tool_field_text(tool, ("features",)).lower()
    tag_category_text = " ".join([tool.category, *tool.tags]).lower()
    summary_text = tool.summary.lower()
    weak_text = _tool_field_text(tool, ("dealSummary", "freeAllowanceText", "limitations")).lower()

    score = 0
    for token in tokens:
        if token in name_alias:
            score += 80
        if token in best_for_text:
            score += 34
        if token in feature_text:
            score += 28
        if token in tag_category_text:
            score += 22
        if token in summary_text:
            score += 14
        if token in weak_text:
            score += 8

    task_terms = TASK_KEYWORDS.get(task, set())
    if task_terms:
        rich_task_text = " ".join([best_for_text, feature_text, tag_category_text, summary_text])
        matched_terms = sum(1 for term in task_terms if term.lower() in rich_task_text)
        score += min(matched_terms, 4) * 22

    if intent_constraints.get("pricing") in {"free", "free_preferred"}:
        if tool.pricingType in {"free", "freemium"}:
            score += 70
        if "免费" in " ".join([tool.dealSummary or "", tool.freeAllowanceText or ""]):
            score += 30

    if intent_constraints.get("language") in {"zh", "zh_preferred"} and tool.accessFlags and tool.accessFlags.cnLang:
        score += 20

    if intent_constraints.get("access") == "domestic_preferred":
        if tool.accessFlags and tool.accessFlags.needsVpn is False:
            score += 70
        if _text_contains_any(" ".join([tool.summary, tool.dealSummary or "", *tool.bestFor, *tool.features]), {"国内", "中文"}):
            score += 16

    return score


def _build_reason(tool: ToolSummary, intent_constraints: dict[str, str], task: str, normalized_query: str) -> str:
    if intent_constraints.get("pricing") in {"free", "free_preferred"} and tool.pricingType in {"free", "freemium"}:
        return "免费版可用，适合作为低成本试用候选"
    if intent_constraints.get("access") == "domestic_preferred" and tool.accessFlags and tool.accessFlags.needsVpn is False:
        return "国内访问更稳定，适合先做可落地验证"
    if intent_constraints.get("pricing") in {"free", "free_preferred"}:
        return "免费信息暂未核验，建议进入详情查看官网额度和最近核验状态"
    if intent_constraints.get("access") == "domestic_preferred":
        return "国内访问状态暂未核验，建议进入详情查看官网和最近核验状态"
    if intent_constraints.get("language") in {"zh", "zh_preferred"} and tool.accessFlags and tool.accessFlags.cnLang:
        return "支持中文界面，降低上手成本"
    if task == "academic-writing":
        return "适合写论文/文档润色，覆盖写作、学术和总结场景"
    if task == "presentation":
        return "适合做 PPT 初稿，覆盖演示、答辩和幻灯片场景"
    if task == "coding":
        return "适合写代码/debug，覆盖开发、测试和接口场景"
    if task == "image-video":
        return "适合生成图片/海报视觉，覆盖图片视频创作场景"
    if task == "data-analysis":
        return "适合数据分析/报表，可用于 BI、SQL 或可视化"
    if task == "agent":
        return "适合智能体和工作流自动化，便于验证任务执行场景"
    if "限制" in normalized_query and tool.limitations:
        return f"主要限制是{tool.limitations[0]}"
    if tool.bestFor:
        return f"适合{tool.bestFor[0]}，可继续比较限制和价格"
    if tool.features:
        return f"核心特点是{tool.features[0]}，适合作为候选"
    if tool.tags:
        return f"覆盖 {tool.tags[0]} 等场景，适合作为候选"
    return "与当前查询关键词匹配，适合进一步比较"


def _build_ai_panel(query: str, intent_payload: dict) -> AiPanel:
    constraints = intent_payload.get("constraints") if isinstance(intent_payload.get("constraints"), dict) else {}
    task = str(intent_payload.get("task") or "general")
    category_hint = str(intent_payload.get("category_hint") or "")
    summary = str(intent_payload.get("intent_summary") or "根据你的输入先展示相关工具")

    active_logic = _build_active_logic(constraints, category_hint, task)
    quick_actions = _build_quick_actions(intent_payload.get("quick_actions") or [])

    return AiPanel(
        title="AI 帮你理解了这个需求",
        user_need=query,
        system_understanding=summary,
        active_logic=active_logic,
        quick_actions=quick_actions,
    )


def search_with_ai(
    *,
    db,
    query: str,
    category: str | None,
    tag: str | None,
    price: str | None,
    access: str | None,
    price_range: str | None,
    sort: str,
    view: str,
    page: int,
    page_size: int,
) -> AiSearchResponse:
    started_at = time.perf_counter()
    normalized_query = normalize_query(query)

    with ThreadPoolExecutor(max_workers=1) as executor:
        intent_future = executor.submit(parse_ai_search_intent, query, normalized_query)
        directory = catalog_service.get_tools_directory(
            db=db,
            q=None,
            category_slug=category,
            tag_slug=tag,
            status_slug=None,
            price_slug=price,
            access_slug=access,
            price_range_slug=price_range,
            sort=sort,
            view=view,
            page=1,
            page_size=max(AI_SEARCH_CANDIDATE_LIMIT, page * page_size),
        )

        intent_payload: dict
        intent_source: str
        cache_hit: bool
        try:
            intent_payload, intent_source, cache_hit = intent_future.result(timeout=INTENT_TIMEOUT_SECONDS + 0.2)
        except TimeoutError:
            intent_payload, intent_source = _build_default_intent(query, normalized_query)
            cache_hit = False

    constraints = intent_payload.get("constraints") if isinstance(intent_payload.get("constraints"), dict) else {}

    task = str(intent_payload.get("task") or "general")
    if task == "general":
        fallback_intent, _ = _build_default_intent(query, normalized_query)
        task = str(fallback_intent.get("task") or task)
        constraints = {**fallback_intent.get("constraints", {}), **constraints}

    scored_items = [(_score_tool(item, normalized_query, constraints, task), item) for item in directory.items]
    if any(score > 0 for score, _ in scored_items):
        scored_items.sort(key=lambda pair: (-pair[0], -float(pair[1].score), not pair[1].featured, pair[1].name.lower()))
        ranked_items = [item for score, item in scored_items if score > 0]
    else:
        ranked_items = [item for _, item in scored_items]

    start = max(page - 1, 0) * page_size
    end = start + page_size
    paged_items = ranked_items[start:end]

    results = [
        AiSearchResult(**{**item.model_dump(), "reason": _build_reason(item, constraints, task, normalized_query)})
        for item in paged_items
    ]

    latency_ms = int((time.perf_counter() - started_at) * 1000)
    directory_payload = directory.model_dump()
    directory_payload.update(
        {
            "total": len(ranked_items),
            "page": page,
            "pageSize": page_size,
            "hasMore": end < len(ranked_items),
            "items": [ToolSummary(**item.model_dump()) for item in results],
        }
    )

    return AiSearchResponse(
        mode="ai",
        query=query,
        normalized_query=normalized_query,
        ai_panel=_build_ai_panel(query, intent_payload),
        results=results,
        directory=ToolsDirectoryResponse(**directory_payload),
        meta=AiSearchMeta(
            latency_ms=latency_ms,
            cache_hit=cache_hit,
            intent_source=intent_source,
        ),
    )
