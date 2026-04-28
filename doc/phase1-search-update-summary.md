# Phase 1 Search Update Summary

## Status

Stage 1 embedding search enhancement is now part of the current backend baseline.

Current routing note:

- Search state is now mainly carried by homepage `/`.
- `/tools` is kept as a legacy redirect entry on the frontend.

- `GET /api/tools` remains the only public search entry.
- The internal search flow is now `lexical search + embedding recall`.
- No frontend page structure was changed.
- No recommendation-chain behavior was changed in this stage.
- No new search infrastructure such as FAISS, Elasticsearch, or Milvus was introduced.

## Interface Notes

Current public search API behavior:

- `GET /api/tools` keeps the same route and response shape.
- When `q` is present, the backend first applies the existing lexical search logic.
- The backend then attempts embedding recall on the filtered candidate set.
- If embeddings are missing, the embedding table is empty, or the embedding call fails, the API falls back to lexical behavior without returning an extra error.

## Data Notes

Stage 1 introduced the search embedding persistence layer:

- table: `tool_embeddings`
- fields:
  - `tool_id`
  - `provider`
  - `model`
  - `content_hash`
  - `source_text`
  - `embedding_json`

Supporting script:

- `apps/api/app/scripts/backfill_tool_embeddings.py`

Current storage choice:

- embeddings are stored in database `Text/JSON`

## Acceptance Coverage

Current automated coverage includes:

- lexical hit still works
- semantic hit can return relevant tools such as `gamma`
- `GET /api/tools?q=写作助手` returns writing-related tools
- partial deletion of embedding rows still preserves lexical fallback
- empty query keeps existing default behavior
- embedding recall exceptions still fall back to lexical results
- backfill is idempotent across repeated runs
- backfill skips a single dirty row instead of failing the whole batch

Current local verification result:

- `pytest tests/test_catalog_cases.py -q` -> `19 passed`
- `pytest tests/test_backfill_tool_embeddings.py -q` -> `2 passed`

## Known Remaining Risks

- The API response still does not expose whether a hit came from lexical recall or embedding recall.
- The hybrid merge order is stable in current implementation, but the response does not yet provide explicit explainability metadata.
- Final returned order is still governed by the existing directory sorting logic, not by dedicated recall-source ranking fields.

## Related Docs

- `doc/phase1-embedding-search-acceptance.md`
- `doc/05-接口规范.md`
- `doc/06-数据结构.md`
- `doc/08-技术架构.md`
- `doc/09-验收标准.md`
