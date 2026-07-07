from __future__ import annotations

import hashlib
import json
import math
import os
import re
import unicodedata
from dataclasses import dataclass
from urllib import error, request

from sqlalchemy import select

from app.core.config import settings
from app.models.models import Tool, ToolEmbedding


STUB_PROVIDER = "stub"
STUB_MODEL = "semantic-hash-v1"
STUB_DIMENSIONS = 64
REMOTE_PROVIDERS = {"openai", "openai-compatible", "volcengine", "ark"}
SEMANTIC_ALIASES: dict[str, tuple[str, ...]] = {
    "presentation": ("ppt", "slides", "slide", "deck", "presentation", "presentations", "幻灯片", "演示", "演示文稿"),
    "writing": ("writing", "copywriting", "content", "article", "blog", "email", "文案", "写作", "文章", "邮件"),
    "data": ("data", "analytics", "analysis", "dashboard", "report", "bi", "数据", "分析", "报表"),
    "image": ("image", "visual", "design", "poster", "banner", "图片", "图像", "海报", "设计"),
    "code": ("code", "coding", "developer", "engineering", "debug", "编程", "代码", "开发", "调试"),
    "chat": ("chat", "chatbot", "assistant", "copilot", "问答", "聊天", "助手"),
}


@dataclass(slots=True)
class EmbeddingResult:
    provider: str
    model: str
    vector: list[float]


def _normalize_text(value: str | None) -> str:
    normalized = unicodedata.normalize("NFKC", value or "").strip().casefold()
    normalized = re.sub(r"[^\w\u4e00-\u9fff\s-]+", " ", normalized, flags=re.UNICODE)
    normalized = re.sub(r"\s+", " ", normalized).strip()
    return normalized


def _get_backend() -> tuple[str, str, str, str]:
    if os.environ.get("CODEX_TESTING") == "1":
        return STUB_PROVIDER, "", STUB_MODEL, ""

    provider = (settings.embedding_provider or STUB_PROVIDER).strip().lower()
    api_key = settings.embedding_api_key.strip()
    model = (settings.embedding_model or "").strip()
    base_url = settings.embedding_openai_base_url.strip()

    if provider in ("", STUB_PROVIDER) or provider not in REMOTE_PROVIDERS or not api_key or not model or not base_url:
        return STUB_PROVIDER, "", STUB_MODEL, ""

    return provider, api_key, model, base_url


def _normalize_embeddings_url(base_url: str) -> str:
    normalized = base_url.rstrip("/")
    if normalized.endswith("/embeddings"):
        return normalized
    if normalized.endswith("/v1") or normalized.endswith("/v3"):
        return f"{normalized}/embeddings"
    return f"{normalized}/v1/embeddings"


def _extract_semantic_tokens(text: str) -> list[str]:
    normalized = _normalize_text(text)
    if not normalized:
        return []

    tokens = [chunk for chunk in re.split(r"[\s/_-]+", normalized) if chunk]
    expanded = list(tokens)

    for canonical, aliases in SEMANTIC_ALIASES.items():
        if any(alias in normalized for alias in aliases):
            expanded.append(canonical)

    return expanded


def _hash_token(token: str) -> int:
    digest = hashlib.sha256(token.encode("utf-8")).hexdigest()
    return int(digest[:16], 16) % STUB_DIMENSIONS


def _normalize_vector(values: list[float]) -> list[float]:
    norm = math.sqrt(sum(value * value for value in values))
    if norm <= 0:
        return values
    return [value / norm for value in values]


def _build_stub_embedding(text: str) -> list[float]:
    vector = [0.0] * STUB_DIMENSIONS
    for token in _extract_semantic_tokens(text):
        vector[_hash_token(token)] += 1.0
    return _normalize_vector(vector)


def _request_remote_embedding(*, api_key: str, model: str, base_url: str, text: str) -> list[float]:
    body = json.dumps({"model": model, "input": text}).encode("utf-8")
    api_request = request.Request(
        _normalize_embeddings_url(base_url),
        data=body,
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        method="POST",
    )
    with request.urlopen(api_request, timeout=20) as response:
        payload = json.loads(response.read().decode("utf-8"))

    data = payload.get("data") or []
    if not data or not isinstance(data[0], dict) or not isinstance(data[0].get("embedding"), list):
        raise ValueError("invalid embedding payload")

    return [float(value) for value in data[0]["embedding"]]


def build_tool_embedding_source(tool: Tool) -> str:
    tags = " ".join(item.tag.name for item in getattr(tool, "tags", []) if getattr(item, "tag", None))
    category_name = tool.category_name
    categories = getattr(tool, "categories", [])
    if categories and getattr(categories[0], "category", None):
        category_name = categories[0].category.name

    fields = [
        tool.name,
        category_name,
        tool.summary,
        tool.description,
        tags,
    ]
    return "\n".join(field.strip() for field in fields if field and field.strip())


def compute_content_hash(source_text: str) -> str:
    return hashlib.sha256(source_text.encode("utf-8")).hexdigest()


def embed_text(text: str) -> EmbeddingResult:
    normalized = text.strip()
    if not normalized:
        return EmbeddingResult(provider=STUB_PROVIDER, model=STUB_MODEL, vector=[])

    provider, api_key, model, base_url = _get_backend()
    if provider == STUB_PROVIDER:
        return EmbeddingResult(provider=STUB_PROVIDER, model=STUB_MODEL, vector=_build_stub_embedding(normalized))

    vector = _request_remote_embedding(api_key=api_key, model=model, base_url=base_url, text=normalized)
    return EmbeddingResult(provider=provider, model=model, vector=_normalize_vector(vector))


def serialize_embedding(vector: list[float]) -> str:
    return json.dumps([round(float(value), 8) for value in vector], ensure_ascii=False)


def deserialize_embedding(payload: str | None) -> list[float]:
    if not payload:
        return []
    try:
        data = json.loads(payload)
    except json.JSONDecodeError:
        return []
    if not isinstance(data, list):
        return []
    return [float(value) for value in data]


def cosine_similarity(left: list[float], right: list[float]) -> float:
    if not left or not right or len(left) != len(right):
        return 0.0
    return sum(a * b for a, b in zip(left, right))


def recall_tool_ids_by_embedding(*, db, query: str, candidate_tool_ids: list[int]) -> list[int]:
    if not query or not candidate_tool_ids:
        return []

    try:
        query_embedding = embed_text(query).vector
    except (ValueError, error.URLError, TimeoutError):
        return []

    if not query_embedding:
        return []

    rows = db.scalars(select(ToolEmbedding).where(ToolEmbedding.tool_id.in_(candidate_tool_ids))).all()
    if not rows:
        return []

    scored: list[tuple[int, float]] = []
    for row in rows:
        candidate_embedding = deserialize_embedding(row.embedding_json)
        if not candidate_embedding:
            continue
        similarity = cosine_similarity(query_embedding, candidate_embedding)
        if similarity >= settings.embedding_recall_min_similarity:
            scored.append((row.tool_id, similarity))

    scored.sort(key=lambda item: item[1], reverse=True)
    return [tool_id for tool_id, _ in scored[: settings.embedding_recall_top_k]]


def backfill_embedding_for_tool(db, tool_id: int) -> bool:
    """
    根据给定的 tool_id 获取对应数据，并调用 embed_text 重构并刷新其向量字段。
    可配合 FastAPI 的 BackgroundTasks 进行异步调用。
    """
    tool = db.scalars(select(Tool).where(Tool.id == tool_id)).first()
    if not tool:
        return False

    source_text = build_tool_embedding_source(tool)
    content_hash = compute_content_hash(source_text)

    existing = db.scalars(select(ToolEmbedding).where(ToolEmbedding.tool_id == tool_id)).first()
    if existing and existing.content_hash == content_hash:
        return True  # 没有更新源文本情况下的命中，免去重新求值

    try:
        result = embed_text(source_text)
        embedding_json = serialize_embedding(result.vector)

        if existing:
            existing.embedding_json = embedding_json
            existing.content_hash = content_hash
            existing.provider = result.provider
            existing.model = result.model
        else:
            new_emb = ToolEmbedding(
                tool_id=tool_id,
                embedding_json=embedding_json,
                content_hash=content_hash,
                provider=result.provider,
                model=result.model,
            )
            db.add(new_emb)
        db.commit()
        return True
    except Exception as e:
        print(f"[EMBEDDING_SERVICE] 回填后台向量时失败 tool_id={tool_id}: {e}")
        db.rollback()
        return False
