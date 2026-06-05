import pytest
from unittest.mock import patch, MagicMock

from app.services.tool_parser_service import fetch_webpage_text, generate_tool_metadata


@patch("app.services.tool_parser_service.socket.getaddrinfo")
@patch("app.services.tool_parser_service.request.urlopen")
def test_fetch_webpage_text_success(mock_urlopen, mock_getaddrinfo):
    mock_getaddrinfo.return_value = [(2, 1, 6, '', ('8.8.8.8', 0))]
    mock_response = MagicMock()
    mock_response.read.return_value = b"<html><head><title>Test Tool AI</title><meta name='description' content='A great AI tool for text'></head><body></body></html>"
    mock_response.__enter__.return_value = mock_response
    mock_urlopen.return_value = mock_response

    result = fetch_webpage_text("http://fake.url.com")
    assert "Test Tool AI" in result
    assert "A great AI tool for text" in result


@patch("app.services.tool_parser_service.socket.getaddrinfo")
@patch("app.services.tool_parser_service.request.urlopen")
def test_fetch_webpage_text_failure(mock_urlopen, mock_getaddrinfo):
    mock_getaddrinfo.return_value = [(2, 1, 6, '', ('8.8.8.8', 0))]
    mock_urlopen.side_effect = Exception("Connection timeout")
    result = fetch_webpage_text("http://fake.url.com")
    assert result == ""


@patch("app.services.tool_parser_service.socket.getaddrinfo")
@patch("app.services.tool_parser_service.fetch_webpage_text")
@patch("app.services.tool_parser_service._call_ai_api")
def test_generate_tool_metadata_success(mock_call_ai_api, mock_fetch, mock_getaddrinfo):
    mock_getaddrinfo.return_value = [(2, 1, 6, '', ('8.8.8.8', 0))]
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


@patch("app.services.tool_parser_service.socket.getaddrinfo")
@patch("app.services.tool_parser_service.fetch_webpage_text")
def test_generate_tool_metadata_empty_page(mock_fetch, mock_getaddrinfo):
    mock_getaddrinfo.return_value = [(2, 1, 6, '', ('8.8.8.8', 0))]
    mock_fetch.return_value = ""
    result = generate_tool_metadata("http://fake.url.com")
    assert result == {}


@patch("app.services.tool_parser_service.socket.getaddrinfo")
@patch("app.services.tool_parser_service.fetch_webpage_text")
@patch("app.services.tool_parser_service._call_ai_api")
def test_generate_tool_metadata_api_failure(mock_call_ai_api, mock_fetch, mock_getaddrinfo):
    mock_getaddrinfo.return_value = [(2, 1, 6, '', ('8.8.8.8', 0))]
    mock_fetch.return_value = "Title: SmartAI"
    mock_call_ai_api.side_effect = Exception("LLM Provider Error")
    result = generate_tool_metadata("http://fake.url.com")
    assert result == {}

def test_validate_public_url_ssrf_protection():
    from app.services.tool_parser_service import validate_public_url

    # Test missing hostname
    with pytest.raises(ValueError, match="只支持公开的 http\(s\) 地址"):
        validate_public_url('http://')

    # Test hex encoding for localhost
    # the exact exception message depends on whether socket.getaddrinfo supports hex on the OS
    # but it should raise a ValueError in either case (gaierror or disallowed IP)
    with pytest.raises(ValueError):
        validate_public_url('http://0x7f000001')


@patch('app.services.tool_parser_service.socket.getaddrinfo')
def test_validate_public_url_dns_resolution(mock_getaddrinfo):
    from app.services.tool_parser_service import validate_public_url

    # Test custom domain resolving to localhost
    mock_getaddrinfo.return_value = [(2, 1, 6, '', ('127.0.0.1', 0))]
    with pytest.raises(ValueError, match="不允许抓取本机或局域网地址"):
        validate_public_url('http://localtest.me')

    # Test custom domain resolving to public IP
    mock_getaddrinfo.return_value = [(2, 1, 6, '', ('8.8.8.8', 0))]
    assert validate_public_url('http://example.com') == 'http://example.com'
