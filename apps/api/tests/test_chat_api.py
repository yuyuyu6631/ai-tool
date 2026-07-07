import json
import os

from fastapi.testclient import TestClient

os.environ.setdefault("DATABASE_URL", "sqlite:///:memory:")
os.environ.setdefault("AI_PROVIDER", "stub")
os.environ.setdefault("AI_API_KEY", "")

from app.main import create_app


client = TestClient(create_app())


def test_chat_endpoint_returns_sse_content_type(monkeypatch):
    """验证 chat 端点返回 text/event-stream 内容类型。"""
    from app.api.routes import chat as chat_route

    def fake_stream_chat_rag(*, db, messages):
        assert db is not None
        assert messages == [{"role": "user", "content": "hello"}]
        yield 'data: {"content": "ok"}\n\n'
        yield "data: [DONE]\n\n"

    monkeypatch.setattr(chat_route, "stream_chat_rag", fake_stream_chat_rag)

    response = client.post("/api/chat", json={"messages": [{"role": "user", "content": "hello"}]})

    assert response.status_code == 200
    assert "text/event-stream" in response.headers["content-type"]
    # 验证 SSE 缓存控制头
    assert response.headers.get("cache-control") == "no-cache"


def test_chat_endpoint_streams_sse_data(monkeypatch):
    """验证流式 SSE 数据可被前端正确解析。"""
    from app.api.routes import chat as chat_route

    def fake_stream_chat_rag(*, db, messages):
        yield 'data: {"content": "你"}\n\n'
        yield 'data: {"content": "好"}\n\n'
        yield "data: [DONE]\n\n"

    monkeypatch.setattr(chat_route, "stream_chat_rag", fake_stream_chat_rag)

    response = client.post("/api/chat", json={"messages": [{"role": "user", "content": "test"}]})

    assert response.status_code == 200
    # 解析 SSE 事件
    events = [line for line in response.text.split("\n\n") if line.strip()]
    content_events = []
    for event in events:
        if event.startswith("data: ") and event.strip() != "data: [DONE]":
            payload = json.loads(event[6:])
            if "content" in payload:
                content_events.append(payload["content"])

    assert content_events == ["你", "好"]


def test_chat_endpoint_error_event(monkeypatch):
    """验证错误事件也以 SSE 格式返回。"""
    from app.api.routes import chat as chat_route

    def fake_stream_chat_rag(*, db, messages):
        yield 'data: {"error": "服务暂时不可用"}\n\n'
        yield "data: [DONE]\n\n"

    monkeypatch.setattr(chat_route, "stream_chat_rag", fake_stream_chat_rag)

    response = client.post("/api/chat", json={"messages": [{"role": "user", "content": "test"}]})

    assert response.status_code == 200
    assert "服务暂时不可用" in response.text
