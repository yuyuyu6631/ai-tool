# 当前实现自动基线

> 此文件由 `npm run docs:sync` 自动生成。
> 代码是唯一事实来源；该文件用于让“当前实现”文档自动跟上代码。

## 摘要

- 生成时间：2026-04-27T08:48:22.906Z
- 前端路由：15
- API 端点：36
- 数据模型：17
- 测试文件：46

## 前端路由

| Route | Type | Redirect | Source |
| --- | --- | --- | --- |
| / | page | - | apps/web/app/page.tsx |
| /admin | page | - | apps/web/app/admin/page.tsx |
| /admin/rankings | page | - | apps/web/app/admin/rankings/page.tsx |
| /admin/reviews | page | - | apps/web/app/admin/reviews/page.tsx |
| /admin/tools | page | - | apps/web/app/admin/tools/page.tsx |
| /admin/tools/[id] | page | - | apps/web/app/admin/tools/[id]/page.tsx |
| /admin/tools/new | page | - | apps/web/app/admin/tools/new/page.tsx |
| /auth | page | - | apps/web/app/auth/page.tsx |
| /compare/[comparisonSlug] | redirect | /compare/${canonicalSlug} | apps/web/app/compare/[comparisonSlug]/page.tsx |
| /matches | page | - | apps/web/app/matches/page.tsx |
| /rankings | redirect | / | apps/web/app/rankings/page.tsx |
| /scenarios | page | - | apps/web/app/scenarios/page.tsx |
| /scenarios/[slug] | page | - | apps/web/app/scenarios/[slug]/page.tsx |
| /tools | redirect | [dynamic redirect] | apps/web/app/tools/page.tsx |
| /tools/[slug] | page | - | apps/web/app/tools/[slug]/page.tsx |

## API 端点

| Method | Path | Handler | Response | Status | Source |
| --- | --- | --- | --- | --- | --- |
| POST | /api | chat_stream | - | - | apps/api/app/api/routes/chat.py |
| GET | /api/admin/overview | get_overview | AdminOverviewResponse | - | apps/api/app/api/routes/admin.py |
| GET | /api/admin/rankings | list_rankings | list[AdminRankingListItem] | - | apps/api/app/api/routes/admin.py |
| POST | /api/admin/rankings | create_ranking | AdminRankingPayload | 201 | apps/api/app/api/routes/admin.py |
| GET | /api/admin/rankings/{ranking_id} | get_ranking | AdminRankingPayload | - | apps/api/app/api/routes/admin.py |
| PUT | /api/admin/rankings/{ranking_id} | update_ranking | AdminRankingPayload | - | apps/api/app/api/routes/admin.py |
| GET | /api/admin/reviews | list_reviews | list[AdminReviewListItem] | - | apps/api/app/api/routes/admin.py |
| DELETE | /api/admin/reviews/{review_id} | delete_review | - | 204 | apps/api/app/api/routes/admin.py |
| GET | /api/admin/tools | list_tools | list[AdminToolListItem] | - | apps/api/app/api/routes/admin.py |
| POST | /api/admin/tools | create_tool | ToolDetail | 201 | apps/api/app/api/routes/admin.py |
| GET | /api/admin/tools/{tool_id} | get_tool | ToolDetail | - | apps/api/app/api/routes/admin.py |
| PUT | /api/admin/tools/{tool_id} | update_tool | ToolDetail | - | apps/api/app/api/routes/admin.py |
| GET | /api/ai-search | get_ai_search | AiSearchResponse | - | apps/api/app/api/routes/ai_search.py |
| POST | /api/auth/login | login | AuthUserResponse | - | apps/api/app/api/routes/auth.py |
| POST | /api/auth/logout | logout | - | 204 | apps/api/app/api/routes/auth.py |
| GET | /api/auth/me | me | AuthUserResponse | - | apps/api/app/api/routes/auth.py |
| POST | /api/auth/register | register | AuthUserResponse | 201 | apps/api/app/api/routes/auth.py |
| GET | /api/categories | get_categories | list[CategorySummary] | - | apps/api/app/api/routes/catalog.py |
| GET | /api/categories/{slug}/tools | get_category_tools | list[ToolSummary] | - | apps/api/app/api/routes/catalog.py |
| POST | /api/crawl/jobs | create_crawl_job | - | - | apps/api/app/api/routes/crawl.py |
| POST | /api/extract | extract_tool_metadata | ParseToolResponse | - | apps/api/app/api/routes/parser.py |
| GET | /api/home | get_home_catalog | HomeCatalogResponse | - | apps/api/app/api/routes/catalog.py |
| GET | /api/rankings | get_rankings | list[RankingSection] | - | apps/api/app/api/routes/catalog.py |
| GET | /api/rankings/{slug} | get_ranking | RankingSection | - | apps/api/app/api/routes/catalog.py |
| POST | /api/recommend | recommend_tools | list[RecommendItem] | - | apps/api/app/api/routes/recommend.py |
| GET | /api/scenarios | get_scenarios | list[ScenarioSummary] | - | apps/api/app/api/routes/catalog.py |
| GET | /api/scenarios/{slug} | get_scenario | ScenarioSummary | - | apps/api/app/api/routes/catalog.py |
| GET | /api/tools | get_tools | ToolsDirectoryResponse | - | apps/api/app/api/routes/catalog.py |
| GET | /api/tools/{slug} | get_tool | ToolDetail | - | apps/api/app/api/routes/catalog.py |
| GET | /api/tools/{tool_slug}/reviews | get_reviews | ToolReviewsResponse | - | apps/api/app/api/routes/reviews.py |
| GET | /api/tools/{tool_slug}/reviews/me | get_my_review | ToolReviewItem \| None | - | apps/api/app/api/routes/reviews.py |
| PUT | /api/tools/{tool_slug}/reviews/me | put_my_review | ToolReviewItem | - | apps/api/app/api/routes/reviews.py |
| GET | /api/tools/import-preview/validation | get_import_preview_validation | - | - | apps/api/app/api/routes/catalog.py |
| GET | /api/tools/search-index | get_search_index | list[ToolSummary] | - | apps/api/app/api/routes/catalog.py |
| GET | /health | health_check | - | - | apps/api/app/main.py |
| GET | /health/ready | readiness_check | - | 503 on failure | apps/api/app/main.py |

## 数据模型

| Table | Class | Fields | Preview | Source |
| --- | --- | --- | --- | --- |
| categories | Category | 5 | id, slug, name, description, tools | apps/api/app/models/models.py |
| crawl_jobs | CrawlJob | 6 | id, source_name, status, started_at, finished_at, error_message | apps/api/app/models/models.py |
| crawl_snapshots | CrawlSnapshot | 6 | id, crawl_job_id, tool_slug, raw_payload, parsed_payload, diff_summary | apps/api/app/models/models.py |
| ranking_items | RankingItem | 6 | id, ranking_id, tool_id, rank_order, reason, tool | apps/api/app/models/models.py |
| rankings | Ranking | 4 | id, slug, title, description | apps/api/app/models/models.py |
| scenario_tools | ScenarioTool | 5 | id, scenario_id, tool_id, is_primary, tool | apps/api/app/models/models.py |
| scenarios | Scenario | 6 | id, slug, title, description, problem, tool_count | apps/api/app/models/models.py |
| sources | Source | 4 | id, tool_id, source_type, source_url | apps/api/app/models/models.py |
| tags | Tag | 3 | id, name, tools | apps/api/app/models/models.py |
| tool_categories | ToolCategory | 5 | id, tool_id, category_id, tool, category | apps/api/app/models/models.py |
| tool_embeddings | ToolEmbedding | 7 | id, tool_id, provider, model, content_hash, source_text, embedding_json | apps/api/app/models/models.py |
| tool_reviews | ToolReview | 15 | id, tool_id, user_id, source_type, status, rating, title, body | apps/api/app/models/models.py |
| tool_tags | ToolTag | 5 | id, tool_id, tag_id, tool, tag | apps/api/app/models/models.py |
| tool_updates | ToolUpdate | 5 | id, tool_id, status, proposed_payload, reviewer_note | apps/api/app/models/models.py |
| tools | Tool | 36 | id, slug, name, category_name, summary, description, editor_comment, developer | apps/api/app/models/models.py |
| user_sessions | UserSession | 8 | id, user_id, session_token_hash, expires_at, revoked_at, user_agent, ip_address, user | apps/api/app/models/models.py |
| users | User | 9 | id, username, email, password_hash, status, role, agreed_terms_at, last_login_at | apps/api/app/models/models.py |

## 测试资产

### Web unit/integration

- 数量：22
- `apps/web/src/app/components/__tests__/BackToResultsLink.test.tsx`
- `apps/web/src/app/components/__tests__/CommandPalette.test.tsx`
- `apps/web/src/app/components/__tests__/CompareToolsGrid.test.tsx`
- `apps/web/src/app/components/__tests__/Header.test.tsx`
- `apps/web/src/app/components/__tests__/ToolCard.test.tsx`
- `apps/web/src/app/components/__tests__/ToolLogo.test.tsx`
- `apps/web/src/app/components/__tests__/ToolReviewsPanel.test.tsx`
- `apps/web/src/app/components/admin/__tests__/AdminAccessGate.test.tsx`
- `apps/web/src/app/components/admin/__tests__/AdminOverviewDashboard.test.tsx`
- `apps/web/src/app/components/admin/__tests__/AdminToolEditor.test.tsx`
- `apps/web/src/app/components/auth/__tests__/AuthCard.test.tsx`
- `apps/web/src/app/features/matches/components/__tests__/MatchFeed.test.tsx`
- `apps/web/src/app/lib/__tests__/catalog-api.test.ts`
- `apps/web/src/app/lib/__tests__/catalog-navigation.test.ts`
- `apps/web/src/app/lib/__tests__/compare-utils.test.ts`
- `apps/web/src/app/lib/__tests__/floating-chat-visibility.test.ts`
- `apps/web/src/app/lib/__tests__/home-page-data.test.ts`
- `apps/web/src/app/lib/__tests__/tool-display.test.ts`
- `apps/web/src/app/pages/__tests__/HomePage.test.tsx`
- `apps/web/src/app/pages/__tests__/ToolDetailPage.test.tsx`
- `apps/web/src/app/pages/__tests__/ToolsPage.test.tsx`
- `apps/web/src/app/utils/__tests__/nlu-agent.test.ts`

### Web e2e

- 数量：5
- `apps/web/src/e2e/auth-checklist.spec.ts`
- `apps/web/src/e2e/home-radar.spec.ts`
- `apps/web/src/e2e/navigation-verify.spec.ts`
- `apps/web/src/e2e/smoke.spec.ts`
- `apps/web/src/e2e/visual.spec.ts`

### API pytest

- 数量：19
- `apps/api/tests/test_ai_integration.py`
- `apps/api/tests/test_api_hardening.py`
- `apps/api/tests/test_api.py`
- `apps/api/tests/test_auth_api.py`
- `apps/api/tests/test_backfill_tool_embeddings.py`
- `apps/api/tests/test_cache_service.py`
- `apps/api/tests/test_catalog_cases.py`
- `apps/api/tests/test_catalog_view_seed.py`
- `apps/api/tests/test_chat_api.py`
- `apps/api/tests/test_chat_rag.py`
- `apps/api/tests/test_demo_ai_search.py`
- `apps/api/tests/test_embedding_service.py`
- `apps/api/tests/test_import_preview_validation.py`
- `apps/api/tests/test_logo_assets.py`
- `apps/api/tests/test_organize_aitool_assets.py`
- `apps/api/tests/test_published_visibility.py`
- `apps/api/tests/test_reviews_admin_api.py`
- `apps/api/tests/test_tool_elements_migration.py`
- `apps/api/tests/test_tool_parser.py`

## 扫描来源

- `apps/web/app/**/*/page.tsx`
- `apps/api/app/api/routes/*.py`
- `apps/api/app/main.py`
- `apps/api/app/models/models.py`
- `apps/web/src/app/**/__tests__/*`
- `apps/web/src/e2e/*`
- `apps/api/tests/*`

