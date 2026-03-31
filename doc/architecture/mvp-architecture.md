# 星点评 MVP 架构说明

## 目录结构

- `apps/web`: Next.js 前端，承接首页、榜单、详情、分类和场景页
- `apps/api`: FastAPI 后端，承接目录数据、推荐接口和抓取任务入口
- `packages/contracts`: 前后端共享类型和种子数据
- `infra/docker`: 本地联调用 Docker Compose
- `infra/sql`: MySQL 初始化脚本

## 数据层

MVP 使用 `MySQL + SQLAlchemy 2 + Alembic`。

核心表：
- `tools`
- `categories`
- `tool_categories`
- `tags`
- `tool_tags`
- `scenarios`
- `scenario_tools`
- `rankings`
- `ranking_items`
- `sources`
- `crawl_jobs`
- `crawl_snapshots`
- `tool_updates`

## 缓存与推荐

- Redis 缓存热门推荐榜单和 `POST /api/recommend` 的响应
- 推荐链路先用规则召回与简单排序，未来可替换为真实 AI 排序器
- 缓存 TTL 默认为 30 分钟

## 部署建议

- Web：Vercel 或 Netlify
- API：ECS / EC2 上以 `gunicorn + uvicorn workers` 运行
- MySQL：RDS
- Redis：云缓存服务

## 本地启动

1. 根目录复制 `.env.example` 为 `.env`
2. `docker compose -f infra/docker/docker-compose.yml up --build`
3. Web 默认使用 `http://localhost:3000`
4. API 默认使用 `http://localhost:8000`
