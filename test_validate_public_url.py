import sys

# Add the apps/api directory to sys.path so we can import modules from it
sys.path.insert(0, "./apps/api")

# We mock 'app.core.config.settings' and 'app.services.ai_client'
# to avoid dependency issues when just testing the `validate_public_url` standalone logic.

import types
app = types.ModuleType("app")
app.core = types.ModuleType("app.core")
app.core.config = types.ModuleType("app.core.config")
app.core.config.settings = type("Settings", (), {"ai_api_key": "", "ai_model": "", "ai_openai_base_url": ""})
app.services = types.ModuleType("app.services")
app.services.ai_client = types.ModuleType("app.services.ai_client")
app.services.ai_client._call_ai_api = lambda *args, **kwargs: {}
app.services.ai_client._extract_json_block = lambda *args, **kwargs: {}
app.services.ai_client._normalize_chat_url = lambda x: x

sys.modules["app"] = app
sys.modules["app.core"] = app.core
sys.modules["app.core.config"] = app.core.config
sys.modules["app.services"] = app.services
sys.modules["app.services.ai_client"] = app.services.ai_client

from app.services.tool_parser_service import validate_public_url

try:
    print(validate_public_url("http://fake.url.com"))
except Exception as e:
    print(f"Error: {type(e).__name__}: {e}")
