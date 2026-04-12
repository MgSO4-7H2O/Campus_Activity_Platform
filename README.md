# 校园活动管理与报名签到平台（Capstone）

## 1. 项目简介

本系统面向高校校园活动管理场景，服务于学生、社团组织者/活动负责人、分级审核管理员与系统管理员，覆盖“活动申请—材料提交—自动匹配审核人—分级审核流转—招募报名—签到—结项—通知/新闻发布”的全流程。

## 2. 技术栈（选型）

在参考仓库技术栈的基础上，保持前后端解耦、易测试与可扩展：

| 层级 | 技术 |
| --- | --- |
| 前端 | React + TypeScript + Vite + Ant Design + React Router + Zustand + TanStack React Query |
| 后端 | Node.js + TypeScript + Express + Prisma + Zod + JWT |
| 数据 | PostgreSQL + Redis |
| 文档 | OpenAPI/Swagger（后端生成）+ Markdown |
| 测试 | Vitest（单测/模块测试）+ Playwright（端到端测试，后续） |
| 工程化 | pnpm Workspace（monorepo）+ ESLint + Prettier |
| 环境 | Docker Compose（推荐统一开发环境） |

更详细的选型理由见：`docs/tech-stack.md`。

## 3. 目录结构

```
campus-activity-platform/
  backend/   # 后端服务（Express + Prisma）
  frontend/  # 前端应用（React + Vite）
  shared/    # 前后端共享类型与契约（TypeScript）
  docs/      # 课程文档与设计说明
```

## 4. 环境要求

- Node.js >= 22
- pnpm >= 10（建议使用 `corepack enable`）
- Docker / Docker Compose（推荐）

## 5. 快速开始（推荐：Docker）

在本目录执行：

```bash
# 1) 启动基础设施（Postgres/Redis，可选 Adminer）
docker compose up -d postgres redis adminer

# （可选）或使用 Makefile
# make up

# 2) 安装依赖
corepack enable
pnpm install

# 3) 配置环境变量（首次）
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# 4) 初始化数据库（首次）
pnpm --filter @campus-activity/server db:generate
pnpm --filter @campus-activity/server db:push

# 5) 启动后端与前端（两个终端，推荐本机运行）
pnpm --filter @campus-activity/server dev
pnpm --filter @campus-activity/web dev
```

访问：
- 前端：`http://localhost:5173`
- 后端健康检查：`http://localhost:3000/api/v1/health`
- 后端 Swagger：`http://localhost:3000/api-docs`
- 数据库管理（Adminer，可选）：`http://localhost:8080`

## 6. 测试（模块测试 + 统一测试）

```bash
# 全仓统一（含 shared/frontend/backend）
pnpm -r test:run

# 仅后端
pnpm --filter @campus-activity/server test:run

# 仅前端
pnpm --filter @campus-activity/web test:run
```

更完整的测试策略与流程见：`docs/testing.md`。

## 7. 可选：完全容器化启动

```bash
make up-full
```
