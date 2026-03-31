from datetime import UTC, datetime


def build_mock_snapshot(source_name: str) -> dict:
    now = datetime.now(UTC).isoformat()
    return {
        "source_name": source_name,
        "captured_at": now,
        "status": "mocked",
        "message": "MVP 阶段先提供调度与快照结构，后续再接入真实抓取逻辑。",
    }
