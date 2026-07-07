from pathlib import Path


def test_tool_product_elements_migration_declares_expected_columns():
    migration = Path(__file__).resolve().parents[1] / "alembic" / "versions" / "20260424_0007_tool_product_elements.py"

    assert migration.exists()
    text = migration.read_text(encoding="utf-8")
    for column_name in (
        "features_json",
        "limitations_json",
        "best_for_json",
        "deal_summary",
        "media_items_json",
    ):
        assert column_name in text
