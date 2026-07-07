import os


# Force deterministic, offline-safe AI behavior for the pytest process.
os.environ["CODEX_TESTING"] = "1"
os.environ["AI_PROVIDER"] = "stub"
os.environ["AI_API_KEY"] = "test-key"
os.environ["AI_MODEL"] = "test-model"
os.environ["AI_OPENAI_BASE_URL"] = "https://example.invalid/v1"
os.environ["EMBEDDING_PROVIDER"] = "stub"
os.environ["EMBEDDING_API_KEY"] = ""
os.environ["EMBEDDING_MODEL"] = ""
os.environ["EMBEDDING_OPENAI_BASE_URL"] = ""
