import pytest
from app.services.tool_parser_service import validate_public_url

def test_validate_public_url_ssrf_prevention():
    # Should block local/private IP variants
    with pytest.raises(ValueError):
        validate_public_url("http://localhost")
    with pytest.raises(ValueError):
        validate_public_url("http://127.0.0.1")
    with pytest.raises(ValueError):
        validate_public_url("http://2130706433") # 127.0.0.1 in decimal
    with pytest.raises(ValueError):
        validate_public_url("http://0x7f000001") # 127.0.0.1 in hex

    # Needs to bypass DNS lookup or fake it, but let's test a valid public URL
    import socket
    from unittest.mock import patch
    with patch("socket.getaddrinfo") as mock_getaddrinfo:
        mock_getaddrinfo.return_value = [(socket.AF_INET, socket.SOCK_STREAM, 6, '', ('8.8.8.8', 0))]
        assert validate_public_url("http://google.com") == "http://google.com"
