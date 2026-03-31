#!/usr/bin/env python3
"""Debug environment variables"""

import os
from app.core.config import settings

print("Current working directory:", os.getcwd())
print()
print("Settings from pydantic:")
print(f"  ai_provider: {settings.ai_provider}")
print(f"  ai_api_key: {settings.ai_api_key[:8] + '...' if settings.ai_api_key else '(empty)'}")
print(f"  ai_model: {settings.ai_model}")
print(f"  ai_openai_base_url: {settings.ai_openai_base_url}")
print()
print("Environment variables from os.environ:")
for key in ["AI_PROVIDER", "AI_API_KEY", "AI_MODEL", "AI_OPENAI_BASE_URL"]:
    val = os.environ.get(key)
    if val:
        if key == "AI_API_KEY" and val:
            print(f"  {key}: {val[:8]}...")
        else:
            print(f"  {key}: {val}")
    else:
        print(f"  {key}: (not set)")
print()
print("Check condition for AI calling:")
condition = settings.ai_provider != "stub" and settings.ai_api_key
print(f"  settings.ai_provider != 'stub' -> {settings.ai_provider != 'stub'}")
print(f"  settings.ai_api_key is truthy -> {bool(settings.ai_api_key)}")
print(f"  Overall condition -> {condition}")
