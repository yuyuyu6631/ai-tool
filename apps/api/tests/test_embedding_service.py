from app.services import embedding_service
from app.services.embedding_service import STUB_MODEL, STUB_PROVIDER, embed_text


def test_embed_text_forces_stub_backend_in_pytest(monkeypatch):
    def fail_if_called(*_args, **_kwargs):
        raise AssertionError("remote embedding should not be called in pytest")

    monkeypatch.setattr("app.services.embedding_service._request_remote_embedding", fail_if_called)

    result = embed_text("presentation assistant")

    assert result.provider == STUB_PROVIDER
    assert result.model == STUB_MODEL
    assert result.vector


def test_embedding_backend_does_not_inherit_chat_ai_config(monkeypatch):
    monkeypatch.delenv("CODEX_TESTING", raising=False)
    monkeypatch.setattr(embedding_service.settings, "ai_provider", "openai")
    monkeypatch.setattr(embedding_service.settings, "ai_api_key", "chat-key")
    monkeypatch.setattr(embedding_service.settings, "ai_model", "chat-model")
    monkeypatch.setattr(embedding_service.settings, "ai_openai_base_url", "https://example.invalid/v1")
    monkeypatch.setattr(embedding_service.settings, "embedding_provider", "")
    monkeypatch.setattr(embedding_service.settings, "embedding_api_key", "")
    monkeypatch.setattr(embedding_service.settings, "embedding_model", "BAAI/bge-m3")
    monkeypatch.setattr(embedding_service.settings, "embedding_openai_base_url", "")

    def fail_if_called(*_args, **_kwargs):
        raise AssertionError("remote embedding should require explicit embedding config")

    monkeypatch.setattr(embedding_service, "_request_remote_embedding", fail_if_called)

    result = embed_text("会议纪要")

    assert result.provider == STUB_PROVIDER
    assert result.model == STUB_MODEL
    assert result.vector
