from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.db.session import SessionLocal
from app.models.models import Tool, ToolCategory, ToolEmbedding, ToolTag
from app.services.embedding_service import (
    build_tool_embedding_source,
    compute_content_hash,
    embed_text,
    serialize_embedding,
)


def run() -> None:
    session: Session = SessionLocal()
    created = 0
    failed = 0
    updated = 0
    skipped = 0

    try:
        tools = session.scalars(
            select(Tool).options(
                selectinload(Tool.tags).selectinload(ToolTag.tag),
                selectinload(Tool.categories).selectinload(ToolCategory.category),
            )
        ).all()

        for tool in tools:
            try:
                with session.begin_nested():
                    source_text = build_tool_embedding_source(tool)
                    if not source_text:
                        skipped += 1
                        continue

                    content_hash = compute_content_hash(source_text)
                    row = session.scalar(select(ToolEmbedding).where(ToolEmbedding.tool_id == tool.id))
                    if row and row.content_hash == content_hash:
                        skipped += 1
                        continue

                    embedding = embed_text(source_text)
                    payload = serialize_embedding(embedding.vector)

                    if row is None:
                        session.add(
                            ToolEmbedding(
                                tool_id=tool.id,
                                provider=embedding.provider,
                                model=embedding.model,
                                content_hash=content_hash,
                                source_text=source_text,
                                embedding_json=payload,
                            )
                        )
                        created += 1
                    else:
                        row.provider = embedding.provider
                        row.model = embedding.model
                        row.content_hash = content_hash
                        row.source_text = source_text
                        row.embedding_json = payload
                        updated += 1
            except Exception as exc:
                failed += 1
                print(f"Skipping tool embedding backfill for slug={tool.slug}: {type(exc).__name__}: {exc}")

        session.commit()
        print(
            f"Embedding backfill complete. created={created} updated={updated} skipped={skipped} failed={failed}"
        )
    finally:
        session.close()


if __name__ == "__main__":
    run()
