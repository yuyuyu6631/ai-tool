from __future__ import annotations

import json
import re
from urllib import error, request

from tenacity import RetryError, retry, retry_if_exception_type, stop_after_attempt, wait_exponential

from app.core.config import settings
from app.schemas.recommend import RecommendRequest
from app.services.prompt_builder import build_prompt


def _normalize_chat_url(base_url: str) -> str:
    normalized = base_url.rstrip("/")
    if normalized.endswith("/chat/completions"):
        return normalized
    if normalized.endswith("/v1") or normalized.endswith("/v3"):
        return f"{normalized}/chat/completions"
    return f"{normalized}/v1/chat/completions"


def _extract_json_block(content: str) -> dict | None:
    # Handle markdown code blocks
    fenced_match = re.search(r"```(?:json)?\s*(\{[\s\S]*?\})\s*```", content, re.DOTALL)
    if fenced_match:
        raw_json = fenced_match.group(1)
        try:
            return json.loads(raw_json)
        except json.JSONDecodeError:
            pass

    # Look for any JSON object in the content
    raw_text = content.strip()
    brace_match = re.search(r"(\{[\s\S]*\})", raw_text, re.DOTALL)
    if not brace_match:
        return None

    raw_json = brace_match.group(1)
    try:
        return json.loads(raw_json)
    except json.JSONDecodeError:
        # Try to fix common issues with trailing commas
        cleaned = re.sub(r",\s*([\]}])", r"\1", raw_json)
        try:
            return json.loads(cleaned)
        except json.JSONDecodeError:
            return None


@retry(
    stop=stop_after_attempt(1),
    wait=wait_exponential(multiplier=1, min=1, max=4),
    retry=retry_if_exception_type((error.URLError, TimeoutError)),
)
def _call_ai_api(api_request: request.Request) -> dict:
    with request.urlopen(api_request, timeout=2) as response:
        return json.loads(response.read().decode("utf-8"))


def rank_with_ai(payload: RecommendRequest, candidates: list) -> tuple[list, dict[str, str]]:
    if not settings.ai_api_key or not settings.ai_model or not settings.ai_openai_base_url:
        return candidates, {}

    candidate_map = {tool.slug: tool for tool in candidates}

    body = {
        "model": settings.ai_model,
        "messages": [
            {
                "role": "system",
                "content": "You rank AI tools for a Chinese recommendation site. Return JSON only.",
            },
            {
                "role": "user",
                "content": build_prompt(payload, candidates),
            },
        ],
        "temperature": 0.2,
        "max_tokens": 1024,
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

    try:
        payload_data = _call_ai_api(api_request)
    except (error.URLError, error.HTTPError, TimeoutError, ValueError, RetryError) as e:
        print(f"[AI_CLIENT] API call failed after retries: {type(e).__name__}: {e}")
        return candidates, {}

    choices = payload_data.get("choices", [])
    if not choices:
        return candidates, {}
        
    message = choices[0].get("message", {})
    # Reasoning models like DeepSeek-R1 put output in reasoning_content
    # Search models like MiniMax might have search_results or specific content structure
    content = message.get("content") or message.get("reasoning_content") or ""
    
    # Check for search results metadata (some proxies or model versions return this)
    search_results = payload_data.get("search_results") or message.get("search_results")
    if search_results:
        print(f"[AI_CLIENT] Search results found: {len(search_results)} items")

    parsed = _extract_json_block(content)

    if not parsed:
        return candidates, {}

    items = parsed.get("items")
    if not isinstance(items, list):
        return candidates, {}

    ai_reasons: dict[str, str] = {}
    ordered_tools = []

    for item in items:
        if not isinstance(item, dict):
            continue
        slug = item.get("slug")
        if slug not in candidate_map:
            continue
        ordered_tools.append(candidate_map[slug])
        reason = item.get("reason")
        if isinstance(reason, str) and reason.strip():
            ai_reasons[slug] = reason.strip()

    if not ordered_tools:
        return candidates, {}

    seen_slugs = {tool.slug for tool in ordered_tools}
    remaining_tools = [tool for tool in candidates if tool.slug not in seen_slugs]
    return [*ordered_tools, *remaining_tools], ai_reasons
