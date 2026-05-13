from unittest.mock import MagicMock, patch

import pytest

from app.services.tool_parser_service import (
    fetch_webpage_text,
    generate_tool_metadata,
    validate_public_url,
)


def test_validate_public_url_success():
    with patch("app.services.tool_parser_service.socket.gethostbyname", return_value="8.8.8.8"):
        assert validate_public_url("https://google.com") == "https://google.com"


def test_validate_public_url_private_ip():
    with patch("app.services.tool_parser_service.socket.gethostbyname", return_value="192.168.1.1"):
        with pytest.raises(ValueError, match="不允许抓取本机或局域网地址"):
            validate_public_url("http://internal.site")


def test_validate_public_url_loopback_ip():
    with patch("app.services.tool_parser_service.socket.gethostbyname", return_value="127.0.0.1"):
        with pytest.raises(ValueError, match="不允许抓取本机或局域网地址"):
            validate_public_url("http://127.0.0.1.nip.io")


def test_validate_public_url_localhost_domain():
    with pytest.raises(ValueError, match="不允许抓取本机或局域网地址"):
        validate_public_url("http://localhost:8080")


def test_validate_public_url_invalid_domain():
    with patch(
        "app.services.tool_parser_service.socket.gethostbyname", side_effect=ValueError("DNS Error")
    ):
        with pytest.raises(ValueError, match="无法解析域名或地址无效"):
            validate_public_url("http://invalid.domain.that.does.not.exist")


@patch("app.services.tool_parser_service.socket.gethostbyname", return_value="8.8.8.8")
@patch("app.services.tool_parser_service.request.urlopen")
def test_fetch_webpage_text_success(mock_urlopen, mock_gethostbyname):
    mock_response = MagicMock()
    mock_response.read.return_value = b"<html><head><title>Test Tool AI</title><meta name='description' content='A great AI tool for text'></head><body></body></html>"
    mock_response.__enter__.return_value = mock_response
    mock_urlopen.return_value = mock_response

    result = fetch_webpage_text("http://fake.url.com")
    assert "Test Tool AI" in result
    assert "A great AI tool for text" in result


@patch("app.services.tool_parser_service.socket.gethostbyname", return_value="8.8.8.8")
@patch("app.services.tool_parser_service.request.urlopen")
def test_fetch_webpage_text_failure(mock_urlopen, mock_gethostbyname):
    mock_urlopen.side_effect = Exception("Connection timeout")
    result = fetch_webpage_text("http://fake.url.com")
    assert result == ""


@patch("app.services.tool_parser_service.socket.gethostbyname", return_value="8.8.8.8")
@patch("app.services.tool_parser_service.fetch_webpage_text")
@patch("app.services.tool_parser_service._call_ai_api")
def test_generate_tool_metadata_success(mock_call_ai_api, mock_fetch, mock_gethostbyname):
    mock_fetch.return_value = "Title: SmartAI\nDescription: Make text smarter"
    mock_call_ai_api.return_value = {
        "choices": [
            {
                "message": {
                    "content": '```json\n{"name": "SmartAI", "summary": "Text tool", "description": "Make text smarter using LLMs.", "category": "写作辅助", "tags": ["文本", "AI"]}\n```'
                }
            }
        ]
    }

    result = generate_tool_metadata("http://fake.url.com")
    assert result.get("name") == "SmartAI"
    assert result.get("category") == "写作辅助"
    assert "文本" in result.get("tags", [])


@patch("app.services.tool_parser_service.socket.gethostbyname", return_value="8.8.8.8")
@patch("app.services.tool_parser_service.fetch_webpage_text")
def test_generate_tool_metadata_empty_page(mock_fetch, mock_gethostbyname):
    mock_fetch.return_value = ""
    result = generate_tool_metadata("http://fake.url.com")
    assert result == {}


@patch("app.services.tool_parser_service.socket.gethostbyname", return_value="8.8.8.8")
@patch("app.services.tool_parser_service.fetch_webpage_text")
@patch("app.services.tool_parser_service._call_ai_api")
def test_generate_tool_metadata_api_failure(mock_call_ai_api, mock_fetch, mock_gethostbyname):
    mock_fetch.return_value = "Title: SmartAI"
    mock_call_ai_api.side_effect = Exception("LLM Provider Error")
    result = generate_tool_metadata("http://fake.url.com")
    assert result == {}
