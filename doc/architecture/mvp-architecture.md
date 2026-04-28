# 星点评 MVP 架构说明

> 本文档描述的是当前 MVP 基线，不再把历史 Demo 架构写成现状。

## 目录结构

- `apps/web`：Next.js 前端，承接首页、工具详情、场景、对比、匹配、认证和后台页面；`/tools`、`/rankings` 为兼容重定向入口
- `apps/api`：FastAPI 后端，承接目录数据、推荐、抓取与认证接口
- `packages/contracts`：共享类型与样例数据
- `infra/docker`：本地联调与容器化配置
- `infra/sql`：数据库初始化脚本

## 数据层

当前使用 `MySQL + SQLAlchemy 2 + Alembic`。

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
- `users`
- `user_sessions`

## 推荐与抓取

- AI 搜索接口为 `GET /api/ai-search`，AI 意图解析 + 工具筛选，返回含 AI Panel 的结构化结果
- 推荐接口为 `POST /api/recommend`，批量返回推荐工具（与 ai-search 是两个独立系统）
- Chat 接口为 `POST /api/chat`，SSE 流式对话，基于 RAG
- 抓取入口为 `POST /api/crawl/jobs`
- 解析入口为 `POST /api/parser/extract`
- 应用生命周期中已接入定时抓取任务骨架
- 抓取与审核发布仍未形成完整闭环

## 认证

- 已落地基础账号认证
- 使用服务端会话与 HttpOnly Cookie
- 当前接口包括注册、登录、登出和读取当前用户

## 本地启动

1. 根目录准备 `.env`
2. 执行 `npm start` 启动本地开发栈，或执行 `npm run dev` 仅启动前端
3. Web 默认使用 `http://localhost:3000`
4. API 默认使用 `http://localhost:8000`
