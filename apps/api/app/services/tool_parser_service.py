import json
import ipaddress
import logging
import os
import re
from urllib.parse import urlparse
from urllib import request

from app.core.config import settings
from app.services.ai_client import _call_ai_api, _extract_json_block, _normalize_chat_url

logger = logging.getLogger(__name__)
_TEST_CHAT_API_KEY = "codex-test-key"
_TEST_CHAT_MODEL = "codex-test-model"
_TEST_CHAT_BASE_URL = "https://codex.testing.invalid/v1"


def validate_public_url(url: str) -> str:
    parsed = urlparse(url.strip())
    hostname = parsed.hostname.casefold() if parsed.hostname else ""
    if parsed.scheme not in {"http", "https"} or not parsed.netloc:
        raise ValueError("只支持公开的 http(s) 地址")

    if hostname in {"localhost", "0.0.0.0"} or hostname.endswith(".local"):
        raise ValueError("不允许抓取本机或局域网地址")

    import socket
    try:
        addrinfo = socket.getaddrinfo(hostname, None)
    except socket.gaierror:
        return parsed.geturl()

    is_internal = False
    for info in addrinfo:
        ip_str = info[4][0]
        try:
            host_ip = ipaddress.ip_address(ip_str)
            if (
                host_ip.is_private
                or host_ip.is_loopback
                or host_ip.is_link_local
                or host_ip.is_multicast
                or host_ip.is_reserved
                or host_ip.is_unspecified
            ):
                is_internal = True
                break
        except ValueError:
            pass

    if is_internal:
        raise ValueError("不允许抓取本机或局域网地址")

    return parsed.geturl()


def fetch_webpage_text(url: str) -> str:
    req = request.Request(validate_public_url(url), headers={"User-Agent": "Mozilla/5.0"})
    try:
        with request.urlopen(req, timeout=10) as response:
            html = response.read().decode("utf-8", errors="ignore")
            title_match = re.search(r"<title>(.*?)</title>", html, re.IGNORECASE | re.DOTALL)
            title = title_match.group(1).strip() if title_match else ""
            meta_desc_match = re.search(
                r"<meta\s+name=[\"']description[\"']\s+content=[\"'](.*?)[\"']",
                html,
                re.IGNORECASE | re.DOTALL,
            )
            desc = meta_desc_match.group(1).strip() if meta_desc_match else ""
            return f"Title: {title}\nDescription: {desc}"
    except ValueError:
        raise
    except Exception as e:
        logger.warning("tool_parser_fetch_failed url=%s error=%s", url, type(e).__name__)
        return ""


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


def generate_tool_metadata(url: str, page_content_override: str | None = None) -> dict:
    """
    通过目标URL的内容提取工具的关键信息（支持依赖AI大模型处理）。
    """
    safe_url = validate_public_url(url)
    api_key, model, base_url = _resolve_chat_backend()
    if not api_key or not model or not base_url:
        return {}

    page_content = page_content_override or fetch_webpage_text(safe_url)
    if not page_content:
        return {}

    prompt = (
        f"请依据下面提取的网页内容，为一个AI工具平台生成该工具的信息。\n"
        f"网页内容：{page_content}\n"
        "请返回JSON格式，包含以下字段：\n"
        "- name: 工具名称\n"
        "- summary: 简短的一句话介绍（30字以内）\n"
        "- description: 详细一点的描述（100字左右）\n"
        "- category: 类别名称（如 写作辅助、图像生成、代码开发、效率办公、无分类）\n"
        "- tags: 最相关的2-4个标签（字符串数组）\n"
    )

    body = {
        "model": model,
        "messages": [
            {"role": "system", "content": "You are a tool info extractor. Return JSON only."},
            {"role": "user", "content": prompt},
        ],
        "temperature": 0.2,
        "max_tokens": 1024,
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
        payload_data = _call_ai_api(api_request)
    except Exception as e:
        logger.exception("tool_parser_ai_call_failed url=%s error=%s", safe_url, type(e).__name__)
        return {}

    choices = payload_data.get("choices", [])
    if not choices:
        return {}

    message = choices[0].get("message", {})
    content = message.get("content") or message.get("reasoning_content") or ""

    parsed = _extract_json_block(content)
    return parsed or {}
