"""
E2E 端到端集成测试，涵盖新增的全套 AI API（Tool Parser + RAG Stream Chat）的外围端点保障。
"""
from unittest.mock import patch
from fastapi.testclient import TestClient

import os
_TEST_DB_PATH = os.path.join(os.path.dirname(__file__), "test_ai_integration.db")
os.environ["DATABASE_URL"] = f"sqlite:///{_TEST_DB_PATH}"

from app.main import create_app
app = create_app()
client = TestClient(app)

@patch("app.api.routes.chat.stream_chat_rag")
def test_api_chat_stream_e2e(mock_stream):
    """
    端到端测试 /api/chat 端点。
    确认路由注入工作正常并且能在 StreamingResponse 里获取流式拼接项。
    """
    mock_stream.return_value = iter(["Hello", " AI", " World"])
    
    resp = client.post("/api/chat", json={
        "messages": [{"role": "user", "content": "寻找一款图像生成工具"}]
    })
    
    assert resp.status_code == 200
    assert resp.text == "Hello AI World"

@patch("app.api.routes.parser.generate_tool_metadata")
def test_api_parser_extract_e2e(mock_parse):
    """
    端到端测试 /api/parser/extract 端点。
    能够通过预期的 API 模型获取并解析到 JSON 返回体。
    """
    mock_parse.return_value = {"name": "智能PPT", "category": "幻灯片"}
    
    resp = client.post("/api/parser/extract", json={"url": "https://ppt.test.example"})
    
    assert resp.status_code == 200
    res_data = resp.json()
    assert res_data["success"] is True
    assert res_data["data"]["name"] == "智能PPT"
    assert res_data["data"]["category"] == "幻灯片"
