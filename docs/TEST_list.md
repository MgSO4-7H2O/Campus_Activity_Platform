# 测试清单与计划

本文档是项目当前测试覆盖、测试命令、测试数据隔离、未执行计划和长期维护项的统一清单。后续新增功能时，只在本文件对应模块补充测试点和状态，不再另起独立计划分区。

本项目是 TypeScript 前后端分层架构，PDF 模板中的“面向对象测试”在这里对应 shared 契约、后端模块接口、Prisma 数据一致性和跨模块协作链路测试；“类模型一致性测试”对应角色、组织、活动、申请、待办、通知、报名、签到、结项之间的数据一致性测试。

## 1. 当前验证结果

| 类型 | 当前结果 | 命令或报告 |
| --- | --- | --- |
| shared 契约测试 | 7 passed | `pnpm --filter @campus-activity/shared test:run` |
| backend 模块/接口测试 | 98 passed | `pnpm --filter @campus-activity/server test:run` |
| frontend 组件/页面测试 | 48 passed | `pnpm --filter @campus-activity/web test:run` |
| 单元/模块测试合计 | 153 passed | 三端 Vitest 合计 |
| mock E2E | 3 passed | `pnpm --filter @campus-activity/web test:e2e` |
| 真实后端 + PostgreSQL E2E | 2 passed | `pnpm --filter @campus-activity/web test:e2e:real` |
| 类型检查 | passed | `pnpm typecheck` |
| lint | passed with existing warnings | `pnpm lint` |
| backend 覆盖率报告 | 已存在 | `backend/coverage/index.html` |
| frontend 覆盖率报告 | 已存在，最近一次语句覆盖率 24.30% | `frontend/coverage/lcov-report/index.html` |
| shared 覆盖率报告 | 已存在 | `shared/coverage/index.html` |

最近一次验证耗时记录：shared 0.56s、backend 19.76s、frontend 13.02s、mock E2E 4.0s、real E2E 7.1s。

## 2. 常用测试命令

| 目标 | 命令 |
| --- | --- |
| 全仓模块测试 | `pnpm -r test:run` |
| shared 契约测试 | `pnpm --filter @campus-activity/shared test:run` |
| 后端接口测试 | `pnpm --filter @campus-activity/server test:run` |
| 前端组件/页面测试 | `pnpm --filter @campus-activity/web test:run` |
| mock E2E | `pnpm --filter @campus-activity/web test:e2e` |
| 真实后端 + PostgreSQL E2E | `pnpm --filter @campus-activity/web test:e2e:real` |
| 类型检查 | `pnpm typecheck` |
| lint | `pnpm lint` |
| 后端覆盖率 | `pnpm --filter @campus-activity/server test:coverage` |
| 前端覆盖率 | `pnpm --filter @campus-activity/web test:coverage` |

真实后端联调测试前需要按 README 启动 Docker PostgreSQL/Redis，并确保 `backend/.env` 指向测试库或 CI 中的 `campus_test`。

## 3. Shared 契约测试

| 状态 | 测试文件 | 测试点 |
| --- | --- | --- |
| [x] | `shared/src/types/roles.test.ts` | roles 枚举基础断言 |
| [x] | `shared/src/types/statuses.test.ts` | activity application workflow statuses、signup statuses |
| [x] | `shared/src/types/http.test.ts` | 成功响应支持可选 metadata；失败响应包含 actionable error fields |
| [x] | `shared/src/types/prisma-contract.test.ts` | ActivityApplicationStatus 与 Prisma enum 同步；SignupStatus 公共 API 命名与 Prisma 存储 enum 映射同步 |

维护规则：新增共享枚举、DTO 或 API 响应契约时，必须补 shared 测试；涉及 Prisma enum 时同步补 Prisma 契约测试。

## 4. Backend 接口与业务测试

| 状态 | 模块 | 测试文件 | 具体测试点 |
| --- | --- | --- | --- |
| [x] | health | `backend/src/modules/health/health.routes.test.ts` | 健康检查 |
| [x] | auth | `backend/src/modules/auth/auth.routes.test.ts` | 学生注册、教师注册、默认 BASIC_USER、重复 username/email/phone、缺少 realName、username 过短、登录成功、密码错误、封禁用户、用户状态变更后旧 token 失效 |
| [x] | users | `backend/src/modules/users/users.routes.test.ts` | 未登录、错误 token、登录后获取 `/users/me`、修改基础信息、非法 email、email/phone 冲突、学生 profile、教师 profile、grade 非数字、`/users/me/roles` |
| [x] | real E2E cleanup | `backend/src/test/real-e2e-cleanup.test.ts` | 删除真实 E2E 用户、级联删除学生 profile、清理真实业务主链路创建的组织、权限申请、立项申请、待办和活动 |
| [x] | role-applications | `backend/src/modules/role-applications/role-applications.routes.test.ts` | 未登录提交、创建 ORGANIZER 并查询本人列表、student 申请 REVIEWER 失败、teacher 申请 REVIEWER 成功、ORGANIZER 缺少组织失败、审核通过写入 user_roles/user_organizations、非 SYS_ADMIN 审核失败、审核拒绝、重复审核失败、同角色同组织待审申请重复提交失败 |
| [x] | activity-applications | `backend/src/modules/activity-applications/activity-applications.routes.test.ts` | 未登录创建、组织者创建草稿、非法 organizationId、申请人更新草稿、非申请人更新失败、提交草稿后创建 reviewer pending task、附件上传/查询/删除、非申请人上传失败、跨 application 删除附件失败、审核拒绝写入 approval record 并处理待办、分配审核人读取详情、无关用户读取失败、非当前审核人 review 失败、退回补材料后重新提交、最终通过后创建 PLANNED activity、查询审核记录 |
| [x] | approval | `backend/src/modules/approval/approval.routes.test.ts` | 未登录查询待办失败、只返回当前分配待办、按 status 过滤、分配人查询详情、非分配人查询失败、分配人处理待办、非分配人处理失败、已处理待办重复处理失败、不支持过滤参数返回校验错误 |
| [x] | announcements / notifications | `backend/src/modules/announcements/announcements.routes.test.ts` | SYS_ADMIN 创建公告草稿、发布写入 publishedAt、BASIC_USER 收到未读通知、查询通知、单条已读、未读数归零、BASIC_USER 创建公告被拒绝、按未读/已读筛选、全部已读、读取其他用户通知失败 |
| [x] | recruitment / signup | `backend/src/modules/recruitment/recruitment-signups.routes.test.ts` | 负责人创建招募草稿、发布后活动进入 RECRUITING、按 PUBLISHED 查询、编辑草稿、关闭招募、已关闭不可发布、非负责人编辑失败、学生报名后创建 SIGNUP_REVIEW 待办、负责人审核通过、待办变为 PROCESSED、审核结果通知申请人、重复报名、取消报名、取消后释放容量、报名附件、报名详情/列表附件可见性、无关用户读取/上传失败、容量满员、时间窗外、报名结束、用户类型/年级/专业限制、非负责人审核失败、负责人审核拒绝 |
| [x] | checkin | `backend/src/modules/checkin/checkin.routes.test.ts` | 负责人创建签到码场次、开启后统计通过报名人数、已通过用户签到、重复签到冲突、负责人查询记录、未开启失败、错误签到码失败、未通过报名失败、手动补签、关闭场次、关闭后签到失败、QRCODE 场次创建/开启/token 签到、QRCODE 错误 token、非负责人创建/开启/关闭/补签/查看失败、开始时间窗外、结束时间窗外、取消报名用户无法签到 |
| [x] | closure | `backend/src/modules/closure/closure.routes.test.ts` | 负责人创建结项草稿、提交后创建 CLOSURE_REVIEW 待办、REVIEWER 审核通过、通过后活动 CLOSED、查询审核记录、通知负责人、非负责人提交失败、未结束活动提交失败、重复结项失败、非 REVIEWER 审核失败、拒绝后活动保持 FINISHED、已拒绝重复审核失败、退回补材料后重新提交、结项附件上传与非申请人上传失败 |
| [x] | admin | `backend/src/modules/admin/admin.routes.test.ts` | 非 SYS_ADMIN 访问用户管理失败、用户列表查询与角色过滤、用户详情、用户状态管理、dashboard 汇总、系统日志查询 |
| [x] | organizations | `backend/src/modules/orgs/orgs.routes.test.ts` | 组织列表与类型过滤、组织树、组织详情、SYS_ADMIN 创建/更新组织、用户组织绑定/查询/解绑、重复绑定失败、重复解绑不存在关系失败、非 SYS_ADMIN 写操作失败 |
| [x] | activities | `backend/src/modules/activities/activities.routes.test.ts` | 活动列表按状态和关键词过滤、活动详情、我的活动、开始活动、结束活动、非负责人状态流转失败、非法状态流转失败 |

Backend 维护规则：后续不再按模块穷尽扩充；只在新增功能、权限规则变化、状态流转变化、数据一致性风险或真实缺陷出现时补回归测试。

## 5. Backend 协作与数据一致性测试

| 状态 | 协作链路 | 已覆盖断言 |
| --- | --- | --- |
| [x] | 角色申请审核 | 审核通过后写入 `user_roles` 与 `user_organizations`；拒绝和重复审核被拒绝 |
| [x] | 活动立项 | 草稿 -> 提交 -> 审核人待办 -> 拒绝/退回/通过；通过后创建 PLANNED activity；审核记录可查询 |
| [x] | 招募报名 | 发布招募后活动进入 RECRUITING；学生报名创建 SIGNUP_REVIEW 待办；审核结果通知申请人 |
| [x] | 签到 | 签到统计基于已通过报名人数；CODE/QRCODE/MANUAL 覆盖；关闭、重复、取消报名边界被拒绝 |
| [x] | 结项 | 提交结项 -> reviewer 待办 -> 通过/拒绝/退回；通过后活动 CLOSED；通知负责人 |
| [x] | 公告通知 | 公告发布后生成通知；通知已读状态和未读数联动 |

保留补测原则：只在发现权限同步问题、非法状态流转或脏数据时补对应回归测试。

## 6. Frontend 组件与页面测试

| 状态 | 页面/组件 | 测试文件 | 具体测试点 |
| --- | --- | --- | --- |
| [x] | App 基础页面 | `frontend/src/app/App.test.tsx` | 基础页面渲染 |
| [x] | RegisterPage | `frontend/src/modules/auth/RegisterPage.test.tsx` | 字段渲染、提交成功、提交失败 |
| [x] | LoginPage | `frontend/src/modules/auth/LoginPage.test.tsx` | 登录成功保存 session、拉取完整用户并回跳来源页；登录失败展示后端错误且不写入 session |
| [x] | MeEditPage | `frontend/src/modules/users/MeEditPage.test.tsx` | 加载基础信息字段；保存成功更新 auth store 并跳转 `/me`；保存失败展示错误并保留输入 |
| [x] | MeProfilePage | `frontend/src/modules/users/MeProfilePage.test.tsx` | student 显示 college/major/grade/className；teacher 显示 departmentName/jobTitle；学生/教师 profile 保存成功和失败 |
| [x] | MePage | `frontend/src/modules/users/MePage.test.tsx` | 展示账号信息、角色和学生 profile；profile 为空时展示空状态；刷新重新请求当前用户 |
| [x] | 路由守卫 | `frontend/src/shared/auth/guards.test.tsx` | 未登录访问受保护页面跳 `/login`；已登录正常显示受保护内容 |
| [x] | AppLayout | `frontend/src/shared/components/AppLayout.test.tsx` | 多角色用户显示角色切换入口；ORGANIZER 视图显示角色菜单；退出登录清空 session 并跳转 `/login` |
| [x] | MyApplicationsPage | `frontend/src/modules/activity-applications/MyApplicationsPage.test.tsx` | 渲染申请列表、按活动名称搜索、切换进行中筛选 |
| [x] | ActivityApplyPage | `frontend/src/modules/activity-applications/ActivityApplyPage.test.tsx` | 从真实 API 加载可选组织、保存草稿、提交申请、保存失败展示错误并保留输入 |
| [x] | ReviewerInboxPage | `frontend/src/modules/approval/ReviewerInboxPage.test.tsx` | 渲染待办、按活动名称/组织搜索、点击立即审核进入详情 |
| [x] | ReviewerDetailPage | `frontend/src/modules/approval/ReviewerDetailPage.test.tsx` | 展示申请详情/附件/审核历史；缺少审核意见阻止确认；审核通过确认弹窗；驳回和退回补材料后返回待办；找不到申请展示空状态 |
| [x] | NotificationCenterPage | `frontend/src/modules/notifications/NotificationCenterPage.test.tsx` | 未读筛选、单条标记已读、全部标记已读 |
| [x] | CheckinPage | `frontend/src/modules/checkin/CheckinPage.test.tsx` | 展示已有签到场次、展示签到码、创建手动签到场次 |
| [x] | ActivityPages | `frontend/src/modules/activities/ActivityPages.test.tsx` | 活动列表状态筛选、关键词搜索、活动详情展示报名和签到入口、活动不存在空状态 |
| [x] | RecruitmentPages | `frontend/src/modules/recruitment/RecruitmentPages.test.tsx` | 已发布招募报名表单、未开放报名提示、我的报名状态、审核通过后显示去签到入口、拒绝理由展示 |
| [x] | ClosureApplyPage | `frontend/src/modules/closure/ClosureApplyPage.test.tsx` | 结项表单字段、附件上传区域、活动总结长度校验、提交成功后返回我的活动 |
| [x] | AdminUsersPage | `frontend/src/modules/admin/AdminUsersPage.test.tsx` | 用户管理 API 数据渲染和关键词筛选 |
| [x] | AdminOrganizationsPage | `frontend/src/modules/admin/AdminOrganizationsPage.test.tsx` | 组织树 API 数据渲染和新增弹窗入口 |
| [x] | TasksPage | `frontend/src/modules/tasks/TasksPage.test.tsx` | 待办 API 数据渲染和状态筛选 |

Frontend 维护规则：当前不再新增页面测试；后续只在页面入口、表单提交、角色权限展示、路由跳转或核心状态反馈变化时补对应关键用例。

## 7. E2E 与真实联调测试

| 状态 | 流程 | 测试文件 | 具体测试点 |
| --- | --- | --- | --- |
| [x] | mock 用户注册-资料-退出闭环 | `frontend/tests/e2e/auth-user-flow.spec.ts` | 打开 `/register`、填写注册表单、mock register API、跳转 `/me/profile`、修改学生 profile、跳转 `/me`、退出登录、再访问 `/me` 跳转 `/login` |
| [x] | mock 组织者立项申请 | `frontend/tests/e2e/organizer-reviewer-flow.spec.ts` | 注入 ORGANIZER 登录态、打开 `/applications`、进入 `/applications/new`、空表单提交触发表单校验 |
| [x] | mock 审核人处理立项待办 | `frontend/tests/e2e/organizer-reviewer-flow.spec.ts` | 注入 REVIEWER 登录态、打开 `/approvals`、进入审核详情、填写审核意见并打开确认弹窗、确认通过后返回 `/approvals` |
| [x] | 真实后端注册-资料-重登闭环 | `frontend/tests/e2e-real/auth-real-backend.spec.ts` | 启动真实 backend、连接真实 PostgreSQL、按唯一用户名隔离数据、浏览器注册/登录/修改 profile、退出后重新登录、验证 profile 持久化、清理测试数据、清理后验证测试用户无法登录 |
| [x] | 真实业务主链路 | `frontend/tests/e2e-real/activity-approval-real-backend.spec.ts` | 创建唯一真实联调用户/管理员/审核人、创建组织并绑定审核人、提交 ORGANIZER 权限申请、管理员审核通过、角色生效、提交活动立项、审核人读取详情并通过、生成 PLANNED 活动、查询审核记录、清理用户/组织/申请/待办/活动 |

真实 E2E 只保留 smoke 级覆盖；新增真实链路前必须先扩展统一前缀清理和残留检测。

## 8. 测试环境与数据隔离

| 状态 | 项目 | 说明 |
| --- | --- | --- |
| [x] | backend Vitest node 环境 | 后端模块测试运行环境 |
| [x] | frontend Vitest jsdom 环境 | 前端组件测试运行环境 |
| [x] | frontend setup.ts | 补 `matchMedia`、`ResizeObserver`、`getComputedStyle`，稳定 Ant Design 测试 |
| [x] | Playwright chromium | mock E2E 与真实 E2E 浏览器 |
| [x] | Vite webServer | Playwright 自动启动前端服务 |
| [x] | 真实后端联调配置 | `frontend/playwright.real.config.ts` |
| [x] | 后端 fixture 清理 | `backend/src/test/fixtures.ts` 在用例前清理测试 fixture 数据 |
| [x] | 真实 E2E 清理脚本 | `backend/src/test/real-e2e-cleanup.ts` |
| [x] | 独立测试数据库 | CI 使用 `campus_test` |
| [x] | CI 自动化测试配置 | `.github/workflows/test.yml` |

数据隔离规则：

- 后端模块测试使用 fixture helper 清理 application、activity、task、notification、user、organization 等测试数据。
- 真实 E2E 使用唯一 `real...` 用户名、邮箱、手机号和组织名前缀。
- 真实 E2E 每个用例结束后清理用户、profile、组织、权限申请、立项申请、待办和活动。
- 新增会创建业务资源的测试时，必须同时更新 `backend/src/test/real-e2e-cleanup.ts` 和对应 cleanup 测试。

## 9. 压力与性能测试计划

当前尚未实现自动化压力测试。根据需求文档和 PDF 模板，本项目的压力与性能测试只保留关键场景，目标是证明常规查询 3 秒内响应、多管理员并发处理待办、报名/签到高峰不会破坏数据一致性。

### 9.1 测试目标

| 状态 | 目标 | 判定标准 |
| --- | --- | --- |
| [ ] | 常规查询响应时间 | 活动列表、通知列表、待办列表、我的申请等接口在目标负载下 p95 <= 3000ms |
| [ ] | 高峰报名稳定性 | 并发报名不超卖，容量限制和重复报名约束保持正确 |
| [ ] | 多审核人并发稳定性 | 待办列表、详情、处理接口无 5xx；重复处理返回明确业务错误 |
| [ ] | 签到高峰稳定性 | 大量签到请求下重复签到、未通过报名、错误 token 仍按规则失败 |
| [ ] | 资源清理可重复 | 压测数据按 `perf_${RUN_ID}_` 前缀隔离，测试后可完全清理 |

### 9.2 测试环境

| 项目 | 要求 |
| --- | --- |
| 数据库 | 使用 `campus_test` 或单独压测库，不使用个人开发库 |
| 服务 | backend 使用生产构建或稳定 dev server；frontend 压测只做浏览器 smoke，不做大并发 UI 压测 |
| 数据前缀 | 用户、组织、活动、报名、签到等全部使用 `perf_${RUN_ID}_` 前缀 |
| 清理方式 | 压测前清理同前缀残留；压测后按前缀删除业务数据并校验残留数量为 0 |
| 记录内容 | 并发数、持续时间、请求总数、失败率、p50/p95/p99、CPU/内存、数据库错误、业务一致性检查结果 |

### 9.3 压力测试场景

| 状态 | 场景 | 输入/负载 | 预期输出 |
| --- | --- | --- | --- |
| [ ] | 登录与当前用户信息 | 20 VUs，持续 3 分钟，循环登录、读取 `/users/me`、读取角色 | p95 <= 3000ms；错误率 < 1%；无 token 状态串扰 |
| [ ] | 常规列表查询 | 30 VUs，持续 3 分钟，读取活动列表、通知列表、待办列表、我的申请 | p95 <= 3000ms；接口无 5xx；分页/筛选结果结构正确 |
| [ ] | 多管理员处理待办 | 10 VUs，持续 3 分钟，查询待办详情并处理预置任务 | p95 <= 3000ms；同一待办只能成功处理一次；重复处理返回业务冲突 |
| [ ] | 报名高峰 | 50 VUs，持续 5 分钟，学生对同一招募报名 | p95 <= 3000ms；报名人数不超过容量；重复报名失败；审核待办数量与成功报名数一致 |
| [ ] | 签到高峰 | 80 VUs，持续 3 分钟，对同一签到场次签到 | p95 <= 3000ms；成功签到人数与有效报名人数一致；重复签到返回冲突；无未授权签到 |
| [ ] | 附件上传基础压力 | 10 VUs，持续 2 分钟，上传小体积立项/报名/结项附件 | p95 <= 5000ms；无脏附件记录；测试文件可清理 |

### 9.4 建议工具与计划命令

目前仓库没有压测脚本，不把压力测试纳入 CI。后续如需要实现，建议新增 `backend/tests/performance/*.ts` 或 `performance/*.js`，使用 k6 或 Artillery 直接压测后端 API。

计划命令示例：

```bash
# 计划新增脚本后使用，当前仓库尚未提供
pnpm --filter @campus-activity/server test:perf
```

压测执行顺序：

1. 启动 Docker PostgreSQL/Redis。
2. 准备 `campus_test` schema 和种子数据。
3. 运行压测前清理，删除 `perf_${RUN_ID}_` 前缀残留。
4. 执行登录、查询、审核、报名、签到、附件上传场景。
5. 执行业务一致性检查，重点检查容量、待办状态、签到记录和通知。
6. 执行压测后清理并校验残留数量为 0。
7. 将结果写入 `docs/testing-maintenance.md` 的最近一次验证记录。

## 10. 当前限制与已知问题

| 状态 | 问题 | 处理方式 |
| --- | --- | --- |
| [x] | 真实 E2E 已覆盖账号 profile 闭环和权限申请/立项审核/活动生成主链路，但未覆盖报名、签到、结项全链路真实联调 | 暂不扩展，除非对应功能改动或验收要求 |
| [x] | 当前不追求穷尽文件上传、分页、移动端布局、性能压力测试 | 只在对应功能变更时补关键用例 |
| [x] | coverage 数字是历史报告，新增大量测试后尚未重新生成 | 覆盖率仅作参考，不设置硬阈值 |
| [x] | `pnpm lint` 通过但 backend 仍有既有 warning | 后续单独清理，不阻塞当前测试文档 |
| [x] | 前端部分测试会输出 React `act(...)` warning 和 Ant Design 兼容/deprecated warning | 测试通过，后续在页面实现或依赖升级时收敛 |
| [x] | 本地后端测试和真实联调 E2E 依赖 `backend/.env` 指向的数据库 | 本地运行前确认环境；CI 使用独立 `campus_test` |
| [ ] | 压力与性能测试尚未实现自动化脚本，也尚未执行 | 按第 9 节计划补最小场景，不纳入当前 CI |

## 11. 维护规则

- 新增或修改功能时，先在对应模块补测试点，再补测试文件。
- 后端功能优先补接口/模块测试，覆盖成功路径、鉴权、参数校验和关键状态变化。
- 前端页面优先补组件/页面测试，覆盖渲染、输入、筛选、提交、错误提示和路由跳转。
- 真实 E2E 只覆盖跨端主链路 smoke，新增链路前必须先设计数据隔离和清理。
- 测试通过后同步更新本文件和 `docs/testing-maintenance.md`。
- 不在测试中吞掉错误，不依赖执行顺序，不依赖个人本地脏数据。
