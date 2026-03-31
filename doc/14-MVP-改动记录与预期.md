# 星点评 MVP 改动记录与预期

## 文档目的

这份文档用于记录本轮 MVP 脚手架搭建中已经完成的修改、当前实际状态，以及下一阶段的预期目标。

它和 [mvp-architecture.md](/d:/codespace/workfile/docs/architecture/mvp-architecture.md) 的区别是：

- 架构文档侧重“怎么设计”
- 本文档侧重“已经改了什么、现在到哪一步、接下来预期做什么”

## 本轮已完成修改

### 1. 仓库结构调整

已经在根目录建立新的 monorepo 结构：

- [apps/web](/d:/codespace/workfile/apps/web)
- [apps/api](/d:/codespace/workfile/apps/api)
- [packages/contracts](/d:/codespace/workfile/packages/contracts)
- [infra/docker](/d:/codespace/workfile/infra/docker)
- [infra/sql](/d:/codespace/workfile/infra/sql)
- [docs/architecture](/d:/codespace/workfile/docs/architecture)

同时保留旧前端目录作为迁移参考：

- [archive/drawer/legacy-frontend](/d:/codespace/workfile/archive/drawer/legacy-frontend)

### 2. 前端脚手架已落地

新的 Web 端已经基于 Next.js App Router 建立完成，当前已具备这些页面和能力：

- 首页 `/`
- 榜单页 `/rankings`
- 工具详情页 `/tools/[slug]`
- 场景页 `/scenarios/[slug]`
- 分类页 `/categories/[slug]`

当前前端特点：

- 首页采用“信息直出”结构
- 榜单页默认直接展示内容
- 已接入 React Query Provider
- 已接入共享契约和本地 fallback 数据
- 已保留品牌 logo 和基础品牌风格

关键文件：

- [apps/web/app/page.tsx](/d:/codespace/workfile/apps/web/app/page.tsx)
- [apps/web/app/rankings/page.tsx](/d:/codespace/workfile/apps/web/app/rankings/page.tsx)
- [apps/web/lib/catalog.ts](/d:/codespace/workfile/apps/web/lib/catalog.ts)

### 3. 后端脚手架已落地

新的 API 端已经基于 FastAPI 建立完成，当前已具备这些接口：

- `GET /api/tools`
- `GET /api/tools/{slug}`
- `GET /api/categories`
- `GET /api/categories/{slug}/tools`
- `GET /api/rankings`
- `GET /api/rankings/{slug}`
- `GET /api/scenarios`
- `GET /api/scenarios/{slug}`
- `POST /api/recommend`
- `POST /api/crawl/jobs`

当前后端特点：

- 使用 Pydantic 定义接口 schema
- 已拆出推荐服务层
- 已拆出 `candidate_selector`、`prompt_builder`、`ai_client`
- Redis 缓存链路已预留
- 定时抓取入口已预留

关键文件：

- [apps/api/app/main.py](/d:/codespace/workfile/apps/api/app/main.py)
- [apps/api/app/api/router.py](/d:/codespace/workfile/apps/api/app/api/router.py)
- [apps/api/app/services/recommendation_service.py](/d:/codespace/workfile/apps/api/app/services/recommendation_service.py)

### 4. 数据库脚手架已落地

数据库已经按 MySQL + SQLAlchemy 2 + Alembic 的方向建好基础骨架。

已完成内容：

- SQLAlchemy 模型
- Alembic 配置
- 初始迁移文件
- seed 脚本
- MySQL 初始化 SQL

当前已覆盖的核心表：

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

关键文件：

- [apps/api/app/models/models.py](/d:/codespace/workfile/apps/api/app/models/models.py)
- [apps/api/alembic/versions/20260327_0001_initial.py](/d:/codespace/workfile/apps/api/alembic/versions/20260327_0001_initial.py)
- [apps/api/app/scripts/seed.py](/d:/codespace/workfile/apps/api/app/scripts/seed.py)

### 5. 本地联调与部署脚手架已落地

已完成：

- 根目录环境变量模板
- Web Dockerfile
- API Dockerfile
- Docker Compose

关键文件：

- [.env.example](/d:/codespace/workfile/.env.example)
- [apps/web/Dockerfile](/d:/codespace/workfile/apps/web/Dockerfile)
- [apps/api/Dockerfile](/d:/codespace/workfile/apps/api/Dockerfile)
- [infra/docker/docker-compose.yml](/d:/codespace/workfile/infra/docker/docker-compose.yml)

## 当前实际状态

当前项目状态可以概括为：

- 新架构已经搭起来了
- Web 和 API 都已经可运行
- 数据库结构已经明确
- 推荐、抓取、缓存都已经有骨架
- 旧前端还没有被完全迁空
- API 目前仍以种子数据和 fallback 为主，不是完整数据库读写版

也就是说，现在已经不是“只有想法”，而是进入了“可继续迭代的正式底座”阶段。

## 当前已完成验证

已验证通过的内容：

- Next.js Web 测试通过
- Next.js Web 构建通过
- FastAPI pytest 通过
- seed 脚本可执行

说明：

- `docker compose` 没有在当前环境实际跑通验证
- 原因不是配置已知报错，而是当前机器没有可用的 `docker` 命令

## 下一阶段预期

### 1. 数据库从“脚手架”进入“真实业务读写”

预期目标：

- API 从静态种子数据切换到 MySQL 查询
- 榜单、工具、分类、场景改为数据库真实返回
- seed 数据用于初始化，而不是长期主数据源

### 2. 前端从“结构迁移”进入“真实业务接线”

预期目标：

- 首页、榜单、详情页全部改为真实 API 取数
- 补齐旧前端里已有的真实素材、logo、文案和品牌内容
- 逐步减少对旧目录的依赖

### 3. 抓取与审核链路进入 MVP 可用态

预期目标：

- 抓取任务真正写入 `crawl_jobs`
- 抓取快照真正写入 `crawl_snapshots`
- 更新候选写入 `tool_updates`
- 后续支持人工审核发布

### 4. 部署从“模板”进入“可交付”

预期目标：

- 本地 Docker Compose 跑通
- 补充生产环境变量说明
- 区分开发、测试、生产环境配置

## 建议的下一步优先级

建议按下面顺序继续推进：

1. 先把 API 切到 MySQL 真实查询
2. 再把前端页面改为真实 API 取数
3. 然后补抓取任务入库和审核流
4. 最后做 Docker 和部署收口

## 预期结果

完成下一阶段后，预期会得到一套真正可持续开发的 MVP 基础设施：

- 前端不是 Demo，而是正式目录站前端
- 后端不是 mock，而是可扩展 API 服务
- 数据库不是草案，而是可迁移、可初始化、可演进的业务底座
- 推荐和抓取不是概念，而是可逐步替换为真实生产能力的服务层
## 补充说明：当前前台展示策略

- 当前前台默认展示全量工具记录，不再只限制 `published`。
- `draft / archived` 会在前台列表、详情、榜单、场景中展示，并通过状态标签标注。
- 这是一套“状态可见、访问不隔离”的当前策略；如果后续恢复“未发布不可公网访问”，需要重新调整 API 和页面行为。
