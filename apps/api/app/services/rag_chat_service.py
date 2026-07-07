"""
RAG 流式对话服务 —— AI 工具导购助手核心模块。

职责：
1. 根据用户查询进行向量召回，构建丰富的 RAG 上下文
2. 组装高质量系统提示词，引导 AI 输出结构化 Markdown
3. 对话历史管理（轮次裁剪，避免超长上下文）
4. 流式 SSE 输出，异常友好降级
"""

import json
import logging
import os
from urllib import error, request

from sqlalchemy import select
from sqlalchemy.orm import joinedload

from app.core.config import settings
from app.models.models import Tool
from app.services.ai_client import _normalize_chat_url
from app.services.embedding_service import recall_tool_ids_by_embedding

logger = logging.getLogger(__name__)
_TEST_CHAT_API_KEY = "codex-test-key"
_TEST_CHAT_MODEL = "codex-test-model"
_TEST_CHAT_BASE_URL = "https://codex.testing.invalid/v1"

# ─── 常量配置 ───────────────────────────────────────────────────────────

# 对话历史中最多保留的用户+助手消息对数（1对 = 2条消息）
MAX_CONVERSATION_PAIRS = 10

# 用户消息过短时，视为闲聊/确认，退回上一轮用户消息做向量召回
MIN_QUERY_LENGTH_FOR_RECALL = 4

PRICING_TYPE_LABELS = {
    "free": "完全免费",
    "freemium": "免费增值",
    "subscription": "订阅制",
    "one_time": "一次性付费",
    "one-time": "一次性付费",
    "contact": "联系销售",
}

# ─── 系统提示词模板 ─────────────────────────────────────────────────────

SYSTEM_PROMPT_TEMPLATE = """\
# 角色设定
你是「星点评 AI 导购助手」，一个专业、友好且值得信赖的 AI 工具推荐顾问。
你深入了解各类 AI 工具的功能、定价、适用场景，能够根据用户需求精准推荐。

# 行为规范
1. **精准推荐**：优先从「知识库上下文」中推荐工具，引用工具名时使用 **加粗** 格式
2. **诚实透明**：如果知识库中没有匹配工具，可以基于自身知识推荐，但必须标注"⚠️ 以下为外部建议，非本平台收录"
3. **结构化输出**：使用 Markdown 格式组织回复（列表、表格、加粗等），提升可读性
4. **中文交流**：全程使用中文回复，保持亲和、专业的语气
5. **推荐附带理由**：每个推荐都要说明"为什么适合用户"，而非简单罗列
6. **不编造数据**：不要编造评分、价格等具体数字，如果不确定就说"建议前往官网确认"
7. **价格中文化**：输出价格时统一使用中文标签，例如“免费 / 免费增值 / 订阅制 / 一次性付费”，不要输出 free/freemium/subscription 等英文值

# 推荐格式示例
当推荐工具时，请采用类似格式：

### 🔧 推荐工具

1. **工具名称** — 简要推荐理由
   - 💰 价格：xxx / 📊 评分：x.x / 🌐 平台：xxx
   - 🔗 [官网链接](url)

如果用户要对比多个工具，请使用表格：

| 工具 | 亮点 | 价格 | 评分 |
|------|------|------|------|
| ... | ... | ... | ... |

# 知识库上下文
以下是本平台收录的相关工具信息，请优先使用这些数据回答：

{context}

如果上下文为空或无匹配，说明当前检索未命中，请基于自身知识辅助回答。
"""


def _normalize_price_text(raw_price: str | None) -> str:
    if not raw_price:
        return ""

    text = raw_price.strip()
    normalized = text.casefold()

    if normalized in {"free", "freemium", "subscription", "one-time", "one_time", "contact"}:
        return PRICING_TYPE_LABELS.get(normalized, text)

    if "free" in normalized:
        if "freemium" in normalized:
            return "免费增值"
        return "免费"
    if "subscription" in normalized or "monthly" in normalized or "yearly" in normalized:
        return "订阅制"
    if "one-time" in normalized or "one_time" in normalized or "lifetime" in normalized:
        return "一次性付费"

    return text


def _normalize_pricing_type(pricing_type: str | None) -> str:
    if not pricing_type:
        return ""
    return PRICING_TYPE_LABELS.get(pricing_type, pricing_type)


def _build_rag_context(db, user_query: str) -> str:
    """根据用户查询，通过向量召回构建丰富的 RAG 上下文字符串。"""
    candidate_tool_ids = db.scalars(select(Tool.id)).all()
    if not candidate_tool_ids:
        return "（暂无收录工具数据）"

    top_ids = recall_tool_ids_by_embedding(
        db=db, query=user_query, candidate_tool_ids=list(candidate_tool_ids)
    )
    if not top_ids:
        return "（未检索到与当前问题匹配的工具）"

    # 使用 joinedload 预加载关联数据，减少 N+1 查询
    tools = db.scalars(
        select(Tool)
        .where(Tool.id.in_(top_ids))
        .options(
            joinedload(Tool.tags),
            joinedload(Tool.categories),
        )
    ).unique().all()

    context_lines = []
    for t in tools:
        # 提取标签
        tags_str = ""
        try:
            if hasattr(t, "tags") and t.tags:
                tags_str = ", ".join(
                    [str(tg.tag.name) for tg in t.tags if getattr(tg, "tag", None)]
                )
        except Exception:
            pass

        # 提取分类名
        category_name = t.category_name
        try:
            if hasattr(t, "categories") and t.categories:
                category_name = t.categories[0].category.name
        except Exception:
            pass

        # 构建详细的上下文行
        detail_parts = [f"📂 分类: {category_name}"]

        if t.score is not None:
            detail_parts.append(f"📊 评分: {t.score}")

        if t.price and t.price.strip():
            detail_parts.append(f"💰 价格: {_normalize_price_text(t.price)}")
        elif t.pricing_type and t.pricing_type != "unknown":
            detail_parts.append(f"💰 定价类型: {_normalize_pricing_type(t.pricing_type)}")

        if t.platforms and t.platforms.strip():
            detail_parts.append(f"🖥️ 平台: {t.platforms}")

        if t.vpn_required and t.vpn_required.strip():
            detail_parts.append(f"🌐 需翻墙: {t.vpn_required}")

        if t.official_url and t.official_url.strip():
            detail_parts.append(f"🔗 官网: {t.official_url}")

        if tags_str:
            detail_parts.append(f"🏷️ 标签: {tags_str}")

        detail_line = " | ".join(detail_parts)

        # 简介
        summary_line = t.summary or ""

        # 编辑评语（如存在）
        editor_line = ""
        if t.editor_comment and t.editor_comment.strip():
            editor_line = f"\n   编辑评语: {t.editor_comment.strip()[:200]}"

        context_lines.append(
            f"- **{t.name}**\n"
            f"   {summary_line}\n"
            f"   {detail_line}{editor_line}"
        )

    return "\n\n".join(context_lines)


def _extract_user_query(messages: list[dict]) -> str:
    """
    提取用于向量召回的用户查询。

    策略：优先使用最后一条用户消息；
    如果太短（如"好的"、"嗯"等确认语），退回到倒数第二条用户消息。
    """
    user_messages = [m for m in messages if m.get("role") == "user"]
    if not user_messages:
        return ""

    last_query = user_messages[-1].get("content", "").strip()

    # 如果最后一条消息过短，且有更早的用户消息，用更早的做召回
    if len(last_query) < MIN_QUERY_LENGTH_FOR_RECALL and len(user_messages) >= 2:
        fallback_query = user_messages[-2].get("content", "").strip()
        if len(fallback_query) >= MIN_QUERY_LENGTH_FOR_RECALL:
            return fallback_query

    return last_query


def _trim_messages(messages: list[dict], max_pairs: int = MAX_CONVERSATION_PAIRS) -> list[dict]:
    """
    裁剪对话历史，保留最近 max_pairs 轮对话（每轮 = 1条user + 1条assistant）。
    始终保留最后一条用户消息。
    """
    if len(messages) <= max_pairs * 2:
        return messages

    # 保留最近 max_pairs * 2 条消息
    return messages[-(max_pairs * 2):]


# ─── SSE 工具函数 ────────────────────────────────────────────────────────

def _sse_data(payload: dict) -> str:
    """将字典序列化为标准 SSE data 行。"""
    return f"data: {json.dumps(payload, ensure_ascii=False)}\n\n"


def _sse_done() -> str:
    """SSE 流结束标记。"""
    return "data: [DONE]\n\n"


def _sse_error(message: str) -> str:
    """将错误信息包装为 SSE 事件，便于前端结构化解析。"""
    return _sse_data({"error": message})


def _resolve_chat_backend() -> tuple[str, str, str]:
    api_key = settings.ai_api_key.strip()
    model = settings.ai_model.strip()
    base_url = settings.ai_openai_base_url.strip()

    if os.environ.get("CODEX_TESTING") == "1":
        return (
            api_key or _TEST_CHAT_API_KEY,
            model or _TEST_CHAT_MODEL,
            base_url or _TEST_CHAT_BASE_URL,
        )

    return api_key, model, base_url


# ─── 核心流式对话生成器 ──────────────────────────────────────────────────

def stream_chat_rag(db, messages: list[dict]):
    """
    基于 RAG 的流式对话生成器。
    输出标准 SSE 格式：每个 chunk 为 `data: {"content": "..."}\n\n`。
    异常时输出 `data: {"error": "..."}\n\n` 便于前端识别和展示。
    """
    api_key, model, base_url = _resolve_chat_backend()
    if not api_key or not model or not base_url:
        yield _sse_data({"content": "系统提示：AI 服务端点未配置，目前暂不支持对话服务。请联系管理员配置 AI_API_KEY、AI_MODEL 和 AI_OPENAI_BASE_URL。"})
        yield _sse_done()
        return

    # 1. 提取用户查询（含意图降级）
    user_query = _extract_user_query(messages)

    # 2. 向量召回构建 RAG 上下文
    context_str = _build_rag_context(db, user_query)

    # 3. 组装系统提示词
    system_prompt = SYSTEM_PROMPT_TEMPLATE.format(context=context_str)

    # 4. 裁剪对话历史
    trimmed_messages = _trim_messages(messages)

    # 5. 组装最终消息列表
    final_messages = [{"role": "system", "content": system_prompt}] + trimmed_messages

    body = {
        "model": model,
        "messages": final_messages,
        "temperature": 0.5,
        "max_tokens": 2048,  # 增大 token 上限以支持更丰富的 Markdown 输出
        "stream": True,
    }

    api_request = request.Request(
        _normalize_chat_url(base_url),
        data=json.dumps(body).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        method="POST",
    )

    try:
        with request.urlopen(api_request, timeout=30) as response:
            for line in response:
                if not line:
                    continue
                decoded_line = line.decode("utf-8").strip()
                if not decoded_line.startswith("data: "):
                    continue

                data_str = decoded_line[6:]
                if data_str == "[DONE]":
                    break

                try:
                    data_json = json.loads(data_str)
                except json.JSONDecodeError:
                    continue

                # 安全提取 content — 防止 choices 为空列表时触发 IndexError
                choices = data_json.get("choices") or []
                if not choices:
                    continue
                delta = choices[0].get("delta") or {}
                chunk_content = delta.get("content", "")
                if chunk_content:
                    yield _sse_data({"content": chunk_content})

        # 正常结束时发送终止信号
        yield _sse_done()

    except error.URLError as e:
        logger.warning("AI 模型服务网络异常: %s", e)
        yield _sse_error(f"网络连接异常，请稍后重试（{type(e).__name__}）")
        yield _sse_done()
    except TimeoutError:
        logger.warning("AI 模型服务请求超时")
        yield _sse_error("请求超时，请稍后重试")
        yield _sse_done()
    except Exception as e:
        logger.exception("AI 模型服务未知异常: %s", e)
        yield _sse_error(f"服务暂时不可用，请稍后重试（{type(e).__name__}）")
        yield _sse_done()
