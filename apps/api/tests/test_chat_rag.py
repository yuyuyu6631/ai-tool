"""
RAG 流式对话服务单元测试 —— 覆盖核心函数和异常处理。
"""

import json

from unittest.mock import patch, MagicMock
from app.services.rag_chat_service import (
    stream_chat_rag,
    _sse_data,
    _sse_done,
    _sse_error,
    _trim_messages,
    _extract_user_query,
)


# ─── _trim_messages 裁剪测试 ────────────────────────────────────────────

class TestTrimMessages:
    """验证对话历史裁剪逻辑。"""

    def test_short_history_unchanged(self):
        """消息数量少于阈值时，原样返回。"""
        msgs = [
            {"role": "user", "content": "你好"},
            {"role": "assistant", "content": "您好！"},
        ]
        result = _trim_messages(msgs, max_pairs=10)
        assert result == msgs

    def test_long_history_trimmed(self):
        """超过阈值时，只保留最近 N 轮对话。"""
        msgs = []
        for i in range(30):
            msgs.append({"role": "user", "content": f"问题 {i}"})
            msgs.append({"role": "assistant", "content": f"回答 {i}"})
        result = _trim_messages(msgs, max_pairs=3)
        assert len(result) == 6
        assert result[0]["content"] == "问题 27"
        assert result[-1]["content"] == "回答 29"

    def test_exact_boundary(self):
        """刚好等于阈值时不裁剪。"""
        msgs = []
        for i in range(5):
            msgs.append({"role": "user", "content": f"问题 {i}"})
            msgs.append({"role": "assistant", "content": f"回答 {i}"})
        result = _trim_messages(msgs, max_pairs=5)
        assert len(result) == 10


# ─── _extract_user_query 意图提取测试 ────────────────────────────────────

class TestExtractUserQuery:
    """验证用户查询意图提取与降级逻辑。"""

    def test_normal_query(self):
        """正常长度的查询直接使用。"""
        msgs = [{"role": "user", "content": "推荐一个写作工具"}]
        assert _extract_user_query(msgs) == "推荐一个写作工具"

    def test_short_query_fallback(self):
        """过短的查询退回到上一条用户消息。"""
        msgs = [
            {"role": "user", "content": "帮我找一个 AI 绘画工具"},
            {"role": "assistant", "content": "好的，我推荐..."},
            {"role": "user", "content": "好的"},
        ]
        result = _extract_user_query(msgs)
        assert result == "帮我找一个 AI 绘画工具"

    def test_short_query_no_fallback_single_message(self):
        """只有一条短消息时，没有可退回的目标，直接返回。"""
        msgs = [{"role": "user", "content": "嗯"}]
        assert _extract_user_query(msgs) == "嗯"

    def test_empty_messages(self):
        """空消息列表返回空字符串。"""
        assert _extract_user_query([]) == ""

    def test_no_user_messages(self):
        """只有 assistant 消息时返回空字符串。"""
        msgs = [{"role": "assistant", "content": "欢迎！"}]
        assert _extract_user_query(msgs) == ""


# ─── SSE 辅助函数测试 ────────────────────────────────────────────────────

def test_sse_helper_functions():
    """验证 SSE 辅助函数输出格式正确。"""
    # _sse_data
    result = _sse_data({"content": "hello"})
    assert result.startswith("data: ")
    assert result.endswith("\n\n")
    assert json.loads(result.removeprefix("data: ").strip())["content"] == "hello"

    # _sse_done
    assert _sse_done() == "data: [DONE]\n\n"

    # _sse_error
    err = _sse_error("test error")
    assert json.loads(err.removeprefix("data: ").strip())["error"] == "test error"


# ─── 流式输出核心测试 ────────────────────────────────────────────────────

@patch("app.services.rag_chat_service._build_rag_context")
@patch("app.services.rag_chat_service.request.urlopen")
def test_stream_chat_rag_yields_sse_content(mock_urlopen, mock_context):
    """正常流式输出：每个 chunk 应包含标准 SSE data 行。"""
    mock_context.return_value = "- **测试工具**: 描述 (标签: 通用)"

    mock_response = MagicMock()
    mock_response.__enter__.return_value = mock_response
    mock_response.__iter__.return_value = iter([
        b'data: {"choices": [{"delta": {"content": "\xe6\xb5\x8b"}}]}\n',
        b'data: {"choices": [{"delta": {"content": "\xe8\xaf\x95"}}]}\n',
        b'data: [DONE]\n'
    ])
    mock_urlopen.return_value = mock_response

    messages = [{"role": "user", "content": "我要找寻工具"}]
    generator = stream_chat_rag(db=MagicMock(), messages=messages)

    results = list(generator)
    # 应该收到两个内容事件 + 一个结束事件
    assert len(results) == 3
    assert json.loads(results[0].removeprefix("data: ").strip())["content"] == "测"
    assert json.loads(results[1].removeprefix("data: ").strip())["content"] == "试"
    assert results[2].strip() == "data: [DONE]"


@patch("app.services.rag_chat_service._build_rag_context")
@patch("app.services.rag_chat_service.request.urlopen")
def test_stream_chat_rag_empty_choices_skipped(mock_urlopen, mock_context):
    """当 AI 模型返回 choices 空列表时，不应触发 IndexError。"""
    mock_context.return_value = ""

    mock_response = MagicMock()
    mock_response.__enter__.return_value = mock_response
    mock_response.__iter__.return_value = iter([
        b'data: {"choices": []}\n',                                    # 空 choices（心跳帧）
        b'data: {"choices": [{"delta": {"role": "assistant"}}]}\n',    # 无 content 的 role 帧
        b'data: {"choices": [{"delta": {"content": "OK"}}]}\n',        # 正常内容
        b'data: [DONE]\n'
    ])
    mock_urlopen.return_value = mock_response

    messages = [{"role": "user", "content": "test"}]
    results = list(stream_chat_rag(db=MagicMock(), messages=messages))

    # 只有 "OK" 这一个内容事件 + 结束事件
    content_events = [r for r in results if "content" in r]
    assert len(content_events) == 1
    assert json.loads(content_events[0].removeprefix("data: ").strip())["content"] == "OK"


@patch("app.services.rag_chat_service.request.urlopen")
def test_stream_chat_rag_network_error(mock_urlopen):
    """网络异常时应输出 SSE 格式的错误事件，而非裸露异常文本。"""
    from urllib.error import URLError
    mock_urlopen.side_effect = URLError("Connection refused")

    messages = [{"role": "user", "content": "hi"}]
    results = list(stream_chat_rag(db=MagicMock(), messages=messages))

    # 应有一个 error 事件和一个 DONE 事件
    assert len(results) == 2
    error_payload = json.loads(results[0].removeprefix("data: ").strip())
    assert "error" in error_payload
    assert "网络连接异常" in error_payload["error"]
    assert results[1].strip() == "data: [DONE]"


@patch("app.services.rag_chat_service.request.urlopen")
def test_stream_chat_rag_timeout_error(mock_urlopen):
    """请求超时时应输出友好的超时提示。"""
    mock_urlopen.side_effect = TimeoutError()

    messages = [{"role": "user", "content": "hi"}]
    results = list(stream_chat_rag(db=MagicMock(), messages=messages))

    assert len(results) == 2
    error_payload = json.loads(results[0].removeprefix("data: ").strip())
    assert "超时" in error_payload["error"]


@patch("app.services.rag_chat_service.request.urlopen")
def test_stream_chat_rag_unknown_error(mock_urlopen):
    """未知异常时应输出通用错误提示，不暴露内部异常信息。"""
    mock_urlopen.side_effect = RuntimeError("unexpected internal error")

    messages = [{"role": "user", "content": "hi"}]
    results = list(stream_chat_rag(db=MagicMock(), messages=messages))

    assert len(results) == 2
    error_payload = json.loads(results[0].removeprefix("data: ").strip())
    assert "服务暂时不可用" in error_payload["error"]
