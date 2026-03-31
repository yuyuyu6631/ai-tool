# 星点评 Monorepo

当前运行链路已经收敛为单一应用栈：

- `apps/web`：唯一前端入口，基于 Next.js
- `apps/api`：唯一后端入口，基于 FastAPI
- `packages/contracts`：前后端共享契约

历史 demo、旧工具资产和临时文件已经移出运行链路，统一归档到 `archive/drawer/`，只作参考，不参与启动、构建或测试。

## 启动

```bash
python start.py
```

也可以使用：

```bash
npm run dev
```

默认行为：

- 自动读取 `秘钥.txt`
- 自动为 API 与前端分配可用端口
- 尝试拉起本地 MySQL / Redis 容器
- 同时启动 `apps/api` 与 `apps/web`

## 常用命令

```bash
npm run build:web
npm run test:web
npm run lint:web
```

## 当前项目结构

```text
workfile/
├─ apps/
│  ├─ api/
│  │  ├─ alembic/              # 数据库迁移
│  │  ├─ app/                  # FastAPI 主代码
│  │  │  ├─ api/               # 路由层
│  │  │  ├─ core/              # 配置项
│  │  │  ├─ db/                # 数据库会话与连接
│  │  │  ├─ models/            # SQLAlchemy 模型
│  │  │  ├─ schemas/           # Pydantic schema
│  │  │  └─ services/          # 目录、推荐、抓取等服务
│  │  ├─ tests/                # API 测试
│  │  ├─ alembic.ini
│  │  ├─ Dockerfile
│  │  └─ pyproject.toml
│  └─ web/
│     ├─ app/                  # Next.js App Router 入口
│     ├─ public/               # 静态资源
│     ├─ src/
│     │  ├─ app/               # 页面组件与业务组件
│     │  ├─ compat/            # 兼容层
│     │  ├─ data/              # 前端内置数据与兜底数据
│     │  └─ styles/            # 主题与全局样式
│     ├─ Dockerfile
│     ├─ next.config.ts
│     ├─ package.json
│     ├─ tsconfig.json
│     └─ vitest.config.ts
├─ packages/
│  └─ contracts/               # 共享类型与契约
├─ infra/
│  ├─ docker/                  # Docker Compose 与容器配置
│  └─ sql/                     # 初始化 SQL
├─ doc/                        # 项目过程文档与架构说明
├─ goal/                       # 愿景、目标与业务方向文档
├─ archive/
│  └─ drawer/
│     ├─ legacy-frontend/      # 已归档的旧前端 Demo
│     ├─ tooling-assets/       # 已归档的旧工具与素材资产
│     ├─ runtime-temp/         # 临时调试产物
│     └─ README.md
├─ .env
├─ .env.example
├─ package.json                # 根工作区脚本
├─ start.py                    # 一键启动脚本
└─ 秘钥.txt
```

## 目录职责

- `apps/api/app/services`：当前后端业务核心，目录查询、推荐、候选筛选、AI 调用都在这里。
- `apps/web/app` 与 `apps/web/src/app`：当前前端页面和组件主入口。
- `packages/contracts`：共享契约层，适合放跨前后端复用的类型定义。
- `infra`：本地开发和部署所需的基础设施配置。
- `archive/drawer`：已经脱离运行链路的历史目录，避免继续污染主工程。

## 归档原则

- 运行链路只保留 `apps/web` 和 `apps/api`
- 构建链路只保留当前 monorepo 需要的脚本与依赖
- 测试链路只覆盖当前有效应用
- 历史目录保留在 `archive/drawer/`，避免继续污染根目录与脚本入口
