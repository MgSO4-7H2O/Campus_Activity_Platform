# 前端阶段交付说明（截至 5.15）

本次提交完成《版本功能边界与阶段任务说明（截至 5.15）》中第 6.1 节"前端需要完成的任务"，并落地《近期安排_登录注册功能.md》中的真实接口联调要求。

## 1. 一句话总结

完成 21 条页面路由、覆盖 PDF 要求的全部 16 个核心页面原型，按角色（BASIC_USER / ORGANIZER / REVIEWER / SYS_ADMIN）切换菜单与可访问页面；登录 / 注册 / 个人信息 / 编辑基础信息 / 编辑扩展资料 5 条与后端真实接口联调，其余页面使用集中 Mock 数据展示完整交互。

## 2. 启动方式

```bash
# 1. 起数据库（postgres / redis / adminer）
docker compose up -d postgres redis adminer    # （需要 sudo 权限）

# 2. 安装依赖（pnpm 已在 ~/.local/bin/pnpm）
pnpm install

# 3. 初始化数据库（首次或 schema 变更后）
pnpm --filter @campus-activity/server db:generate
pnpm --filter @campus-activity/server db:migrate
pnpm --filter @campus-activity/server db:seed

# 4. 起后端 / 前端（两个终端）
pnpm --filter @campus-activity/server dev   # http://localhost:3000
pnpm --filter @campus-activity/web    dev   # http://localhost:5173
```

种子账号（密码统一 `Password123!`）：

| 用户名      | 角色                 | 类型     | 进入后默认菜单           |
| ----------- | -------------------- | -------- | ------------------------ |
| student1    | BASIC_USER           | 学生     | 参与活动                 |
| organizer1  | BASIC_USER+ORGANIZER | 学生     | 参与活动 / 我的活动      |
| reviewer1   | BASIC_USER+REVIEWER  | 教师     | 审核工作台               |
| admin       | BASIC_USER+SYS_ADMIN | 教师     | 系统管理                 |

> 拥有多角色的账号在右上角会出现"当前视图"切换器，可即时切换以验证不同角色的菜单与权限。

## 3. 页面与路由（21 条）

PDF 6.1 要求的 16 个原型页面全部就位（标 ✅ 为必须，标 ⭐ 为辅助页）：

| #   | 页面                | 路由                              | 文件                                                 | 必须 |
| --- | ------------------- | --------------------------------- | ---------------------------------------------------- | ---- |
| 1   | 首页 公告/新闻      | `/`                               | modules/home/HomePage.tsx                            | ✅   |
| 2   | 登录                | `/login`                          | modules/auth/LoginPage.tsx                           | ✅   |
| 3   | 注册                | `/register`                       | modules/auth/RegisterPage.tsx                        | ✅   |
| 4   | 个人信息            | `/me`                             | modules/users/MePage.tsx                             | ✅   |
| 5   | 编辑基础信息        | `/me/edit`                        | modules/users/MeEditPage.tsx                         | ⭐   |
| 6   | 编辑扩展资料        | `/me/profile`                     | modules/users/MeProfilePage.tsx                      | ⭐   |
| 7   | 通知中心            | `/notifications`                  | modules/notifications/NotificationCenterPage.tsx     | ✅   |
| 8   | 权限申请            | `/permissions/apply`              | modules/permissions/PermissionApplyPage.tsx          | ✅   |
| 9   | 我的申请            | `/applications`                   | modules/activity-applications/MyApplicationsPage.tsx | ✅   |
| 10  | 活动立项申请        | `/applications/new`               | modules/activity-applications/ActivityApplyPage.tsx  | ✅   |
| 11  | reviewer 待办       | `/approvals`                      | modules/approval/ReviewerInboxPage.tsx               | ✅   |
| 12  | 审核详情            | `/approvals/:id`                  | modules/approval/ReviewerDetailPage.tsx              | ✅   |
| 13  | 活动列表            | `/activities`                     | modules/activities/ActivityListPage.tsx              | ⭐   |
| 14  | 活动详情            | `/activities/:id`                 | modules/activities/ActivityDetailPage.tsx            | ✅   |
| 15  | 招募创建/发布       | `/activities/:id/recruitment`     | modules/recruitment/RecruitmentEditPage.tsx          | ✅   |
| 16  | 报名                | `/activities/:id/register`        | modules/recruitment/ActivityRegisterPage.tsx         | ✅   |
| 17  | organizer 审核报名  | `/activities/:id/registrations`   | modules/recruitment/RegistrationReviewPage.tsx       | ✅   |
| 18  | 签到                | `/activities/:id/checkin`         | modules/checkin/CheckinPage.tsx                      | ✅   |
| 19  | 结项申请            | `/activities/:id/closure`         | modules/closure/ClosureApplyPage.tsx                 | ✅   |
| 20  | 结项待审 + 审核详情 | `/approvals/closures` + `/closures/:id/review` | modules/closure/ClosureInboxPage.tsx 等 | ✅ |
| 21  | 系统管理            | `/admin/role-applications` `/admin/announcements` | modules/sysadmin/*                                   | ⭐   |

## 4. 角色与菜单分组

`shared/components/AppLayout.tsx` 的 `buildMenu` 按 `viewRole` 渲染：

* 未登录：首页 / 活动列表 / 登录 / 注册
* 登录后通用：通知中心 / 权限申请
* `BASIC_USER` `ORGANIZER`：参与活动（活动列表、我的报名）
* `ORGANIZER`：我的活动（活动立项、我的申请、我负责的活动）
* `REVIEWER`：审核工作台（立项待办、结项待审）
* `SYS_ADMIN`：系统管理（权限申请审核、公告管理）

## 5. 页面 ↔ 接口对照清单

> ✅ 已对接真实接口；🟡 已设计 Mock，等后端骨架就位即可替换；空 ⇒ 当前阶段无需后端。

| 页面                          | 操作                       | 后端接口                          | 状态 |
| ----------------------------- | -------------------------- | --------------------------------- | ---- |
| `/login`                      | 登录                       | `POST /api/v1/auth/login`         | ✅   |
| `/login`                      | 登录后拉资料               | `GET /api/v1/users/me`            | ✅   |
| `/register`                   | 注册                       | `POST /api/v1/auth/register`      | ✅   |
| `/me`                         | 加载个人信息               | `GET /api/v1/users/me`            | ✅   |
| `/me/edit`                    | 加载、保存基础信息         | `GET /users/me`、`PATCH /users/me`| ✅   |
| `/me/profile`                 | 加载、保存学生/教师扩展    | `GET /users/me`、`PATCH /users/me/profile` | ✅ |
| 用户菜单                      | 退出登录                   | 客户端清 token（无后端调用）      | ✅   |
| `/notifications`              | 列表 / 标已读 / 全部已读   | `GET /notifications` `PATCH /notifications/:id/read` `POST /notifications/read-all` | 🟡 |
| `/permissions/apply`          | 提交权限申请               | `POST /role-applications`         | 🟡   |
| `/permissions/apply`          | 我的权限申请记录           | `GET /role-applications/me`       | 🟡   |
| `/applications`               | 我的活动立项申请列表       | `GET /activity-applications/me`   | 🟡   |
| `/applications/new`           | 保存草稿 / 提交立项        | `POST /activity-applications` `PATCH /activity-applications/:id` `POST /activity-applications/:id/submit` | 🟡 |
| `/approvals`                  | reviewer 待办列表          | `GET /approvals/inbox`            | 🟡   |
| `/approvals/:id`              | 审核详情                   | `GET /activity-applications/:id`  | 🟡   |
| `/approvals/:id`              | 通过 / 驳回 / 要求补材料   | `POST /approvals/:id/decide`      | 🟡   |
| `/activities`                 | 活动列表                   | `GET /activities`                 | 🟡   |
| `/activities/:id`             | 活动详情 + 招募信息        | `GET /activities/:id`             | 🟡   |
| `/activities/:id/recruitment` | 创建 / 编辑 / 发布招募     | `POST /activities/:id/recruitment` `POST /recruitments/:id/publish` | 🟡 |
| `/activities/:id/register`    | 提交报名                   | `POST /activities/:id/registrations` | 🟡 |
| `/activities/:id/registrations` | 报名审核（通过 / 拒绝） | `GET /activities/:id/registrations` `POST /registrations/:id/decide` | 🟡 |
| `/activities/:id/checkin`     | 创建签到 / 拉签到记录      | `POST /activities/:id/checkin-sessions` `GET /checkin-sessions/:id/records` | 🟡 |
| `/activities/:id/closure`     | 提交结项                   | `POST /activities/:id/closure`    | 🟡   |
| `/approvals/closures`         | 结项审核待办               | `GET /approvals/closures`         | 🟡   |
| `/closures/:id/review`        | 结项审批                   | `POST /closures/:id/decide`       | 🟡   |
| `/admin/role-applications`    | 权限申请审批               | `GET /admin/role-applications` `POST /admin/role-applications/:id/decide` | 🟡 |
| `/admin/announcements`        | 发布 / 管理公告            | `POST /announcements` `PATCH /announcements/:id`                          | 🟡 |
| 首页 / 通知图标               | 未读数                     | `GET /notifications/unread-count` | 🟡   |

`GET /api/v1/users/me/roles` 已在 `shared/api/users.ts` 中暴露但当前未单独调用——`/users/me` 已带 roles 字段，避免一次冗余请求；如后端调整再启用。

## 6. 关键工程化改动

* **类型基线修复**：新增 `src/vite-env.d.ts`（修正 `import.meta.env` 类型）、`App.test.tsx` 引入 `@testing-library/jest-dom/vitest`、ESLint 忽略 tsc 生成的 `vite.config.js / .d.ts`。
* **登录态升级**：`shared/auth/store.ts` 不再只存 token，而是同时持久化 `user` 与 `viewRole`；新增 `pickDefaultRole`、`hasRole` 工具。
* **路由守卫**：`shared/auth/guards.tsx` 提供 `<RequireAuth>`，未登录跳 `/login` 并把来源页放进 `state.from`，登录后回跳。
* **统一布局**：`shared/components/AppLayout.tsx` 提供 Sider + Header + Outlet，按角色组织一级 / 二级菜单，顶栏带未读 Badge、用户下拉、角色切换器。
* **集中 Mock**：`shared/mock/data.ts` 输出所有原型页所需的实体（活动、招募、报名、签到、结项、公告、通知、权限申请），并暴露所有状态枚举的中文/颜色映射。
* **统一状态标签**：`shared/components/StatusTag.tsx` 提供 `ApplicationStatusTag` `ActivityStatusTag` `RecruitmentStatusTag` `RegistrationStatusTag`，后续切真实接口时复用。
* **国际化**：`<ConfigProvider locale={zhCN}>` 让 DatePicker / Pagination 等组件中文化。

## 7. 已通过的检查

```text
pnpm --filter @campus-activity/web typecheck   ✅ 0 errors
pnpm --filter @campus-activity/web lint        ✅ 0 problems
pnpm --filter @campus-activity/web test:run    ✅ 1/1 passed
pnpm --filter @campus-activity/web build       ✅ vite build ok（≈479KB gzip）
```

端到端联调（curl）：注册 → 登录 → 拉 me → PATCH me → PATCH me/profile → GET roles → 401/409/401 异常路径 全部通过。

页面 SSR 烟囱测试：21 条路由对 vite dev server 全部 200。

## 8. 已知 / 后续

1. 当前打包体积 1.5MB（gzip 480KB），主要来自 antd。后续若需要可启用路由级 code split + manualChunks。
2. 招募发布、签到创建等"原型表单"目前用 setTimeout 模拟成功路径，等后端骨架就位将替换为真实接口。
3. 我的报名 / 我负责的活动等列表当前展示 mock 全集，等后端就位将按 userId 过滤。
4. 通知中心使用本地 state，刷新页面会回到初始 mock；接入后端 `/notifications/:id/read` 后会持久化。

## 9. 文件清单

新增：
- `src/vite-env.d.ts`
- `src/shared/auth/guards.tsx`
- `src/shared/components/AppLayout.tsx`
- `src/shared/components/PageHeader.tsx`
- `src/shared/components/StatusTag.tsx`
- `src/shared/mock/data.ts`
- `src/modules/home/HomePage.tsx`
- `src/modules/auth/LoginPage.tsx`
- `src/modules/auth/RegisterPage.tsx`
- `src/modules/users/MePage.tsx`
- `src/modules/users/MeEditPage.tsx`
- `src/modules/users/MeProfilePage.tsx`
- `src/modules/notifications/NotificationCenterPage.tsx`
- `src/modules/permissions/PermissionApplyPage.tsx`
- `src/modules/activity-applications/ActivityApplyPage.tsx`
- `src/modules/activity-applications/MyApplicationsPage.tsx`
- `src/modules/approval/ReviewerInboxPage.tsx`
- `src/modules/approval/ReviewerDetailPage.tsx`
- `src/modules/activities/ActivityListPage.tsx`
- `src/modules/activities/ActivityDetailPage.tsx`
- `src/modules/activities/MyActivitiesPage.tsx`
- `src/modules/recruitment/RecruitmentEditPage.tsx`
- `src/modules/recruitment/ActivityRegisterPage.tsx`
- `src/modules/recruitment/RegistrationReviewPage.tsx`
- `src/modules/recruitment/MyRegistrationsPage.tsx`
- `src/modules/checkin/CheckinPage.tsx`
- `src/modules/closure/ClosureApplyPage.tsx`
- `src/modules/closure/ClosureInboxPage.tsx`
- `src/modules/closure/ClosureReviewPage.tsx`
- `src/modules/sysadmin/RoleApplicationReviewPage.tsx`
- `src/modules/sysadmin/AnnouncementManagePage.tsx`

修改：
- `src/main.tsx`（无变动）
- `src/app/App.tsx`（重写为完整路由表）
- `src/app/App.test.tsx`（改为 LoginPage 渲染测试）
- `src/shared/auth/store.ts`（扩展 user + viewRole）
- `eslint.config.js`（追加 ignores）

删除：
- `src/shared/components/ComingSoon.tsx`
- 11 个旧 `modules/*/index.tsx` 占位文件
