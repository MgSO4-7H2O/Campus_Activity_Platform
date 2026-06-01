测试体系
├── 当前验证结果
│   ├── [x] 单元/模块测试：91 个用例通过
│   │   ├── shared：6 passed
│   │   ├── backend：57 passed
│   │   └── frontend：28 passed
│   ├── [x] 类型检查通过
│   │   └── pnpm typecheck
│   ├── [x] E2E 测试：mock 前端流程 3 个用例通过
│   │   └── pnpm --filter @campus-activity/web test:e2e
│   ├── [x] 真实后端 + PostgreSQL E2E：1 个用例通过
│   │   └── pnpm --filter @campus-activity/web test:e2e:real
│   ├── [x] backend 覆盖率报告已存在
│   │   └── backend/coverage/index.html
│   ├── [x] frontend 覆盖率报告已存在：最近一次语句覆盖率 24.30%
│   │   └── frontend/coverage/lcov-report/index.html
│   └── [x] shared 覆盖率报告已存在
│       └── shared/coverage/index.html
│
├── [x] shared 共享契约测试
│   ├── [x] roles 枚举基础测试
│   │   └── shared/src/types/roles.test.ts
│   ├── [x] statuses 状态枚举测试
│   │   └── shared/src/types/statuses.test.ts
│   │   ├── [x] activity application workflow statuses
│   │   └── [x] signup statuses
│   ├── [x] API 响应结构测试
│   │   └── shared/src/types/http.test.ts
│   │   ├── [x] 成功响应支持可选 metadata
│   │   └── [x] 失败响应包含 actionable error fields
│   └── [ ] shared 与 Prisma enum 一致性测试
│
├── [x] backend 后端接口测试
│   ├── [x] health 健康检查
│   │   └── backend/src/modules/health/health.routes.test.ts
│   ├── [x] auth 注册/登录测试
│   │   └── backend/src/modules/auth/auth.routes.test.ts
│   │   ├── [x] 学生注册成功
│   │   ├── [x] 教师注册成功
│   │   ├── [x] 默认 BASIC_USER
│   │   ├── [x] 重复 username 失败
│   │   ├── [x] 缺少 realName 失败
│   │   ├── [x] username 过短失败
│   │   ├── [x] 登录成功
│   │   └── [x] 密码错误登录失败
│   ├── [x] users 当前用户信息测试
│   │   └── backend/src/modules/users/users.routes.test.ts
│   │   ├── [x] 未登录访问 /users/me 失败
│   │   ├── [x] 错误 token 访问失败
│   │   ├── [x] 登录后获取 /users/me 成功
│   │   ├── [x] 修改基础信息成功
│   │   ├── [x] 非法 email 失败
│   │   ├── [x] 修改学生 profile 成功
│   │   ├── [x] 修改教师 profile 成功
│   │   └── [x] grade 非数字失败
│   ├── [x] real E2E 数据清理 helper 测试
│   │   └── backend/src/test/real-e2e-cleanup.test.ts
│   │   ├── [x] 删除真实 E2E 创建的测试用户
│   │   └── [x] 级联删除学生 profile
│   ├── [x] role-applications 角色申请接口测试
│   │   └── backend/src/modules/role-applications/role-applications.routes.test.ts
│   │   ├── [x] 未登录提交申请失败
│   │   ├── [x] 创建 ORGANIZER 申请并查询本人申请列表
│   │   ├── [x] student 申请 REVIEWER 失败
│   │   ├── [x] teacher 申请 REVIEWER 成功
│   │   ├── [x] ORGANIZER 申请缺少组织绑定失败
│   │   ├── [x] 审核通过后写入 user_roles 与 user_organizations
│   │   ├── [x] 非 SYS_ADMIN 审核失败
│   │   ├── [x] 审核拒绝
│   │   └── [x] 已审核申请重复审核失败
│   ├── [x] activity-applications 活动立项接口测试
│   │   └── backend/src/modules/activity-applications/activity-applications.routes.test.ts
│   │   ├── [x] 未登录创建失败
│   │   ├── [x] 已认证组织者创建草稿成功
│   │   ├── [x] 非法 organizationId 创建失败
│   │   ├── [x] 申请人更新草稿成功
│   │   ├── [x] 非申请人更新失败
│   │   └── [x] 提交草稿后创建 reviewer pending task
│   ├── [x] approval 待办与审核流转测试
│   │   └── backend/src/modules/approval/approval.routes.test.ts
│   │   ├── [x] 未登录查询待办失败
│   │   ├── [x] 只返回分配给当前用户的待办
│   │   ├── [x] 支持按 status 过滤
│   │   └── [x] 不支持的过滤参数返回校验错误
│   ├── [x] announcements / notifications 公告与通知联动测试
│   │   └── backend/src/modules/announcements/announcements.routes.test.ts
│   │   ├── [x] SYS_ADMIN 创建公告草稿
│   │   ├── [x] 发布公告后写入 publishedAt
│   │   ├── [x] BASIC_USER 收到未读通知
│   │   ├── [x] 查询通知列表
│   │   ├── [x] 标记通知已读后未读数归零
│   │   ├── [x] BASIC_USER 创建公告被拒绝
│   │   ├── [x] 按未读 / 已读状态筛选通知
│   │   ├── [x] 全部标记已读
│   │   └── [x] 读取其他用户通知失败
│   ├── [x] recruitment / signup 招募报名测试
│   │   └── backend/src/modules/recruitment/recruitment-signups.routes.test.ts
│   │   ├── [x] 负责人为已立项活动创建招募草稿
│   │   ├── [x] 发布招募后活动进入 RECRUITING
│   │   ├── [x] 招募列表按 PUBLISHED 查询
│   │   ├── [x] 编辑招募草稿
│   │   ├── [x] 关闭招募
│   │   ├── [x] 非负责人编辑招募失败
│   │   ├── [x] 学生报名后创建 SIGNUP_REVIEW 待办
│   │   ├── [x] 负责人审核通过报名
│   │   ├── [x] 审核后待办变为 PROCESSED
│   │   ├── [x] 审核结果通知申请人
│   │   ├── [x] 重复报名失败
│   │   ├── [x] 申请人取消报名
│   │   ├── [x] 非负责人审核报名失败
│   │   └── [x] 负责人审核拒绝报名
│   ├── [x] checkin 签到测试
│   │   └── backend/src/modules/checkin/checkin.routes.test.ts
│   │   ├── [x] 负责人创建签到码场次
│   │   ├── [x] 开启场次后统计已通过报名人数
│   │   ├── [x] 已通过报名用户使用签到码签到
│   │   ├── [x] 重复签到返回冲突
│   │   ├── [x] 负责人查询签到记录
│   │   ├── [x] 未开启场次签到失败
│   │   ├── [x] 错误签到码失败
│   │   ├── [x] 未通过报名用户签到失败
│   │   ├── [x] 手动补签
│   │   ├── [x] 关闭签到场次
│   │   └── [x] 已关闭场次签到失败
│   ├── [x] closure 结项测试
│   │   └── backend/src/modules/closure/closure.routes.test.ts
│   │   ├── [x] 负责人创建结项草稿
│   │   ├── [x] 提交结项后创建 CLOSURE_REVIEW 待办
│   │   ├── [x] REVIEWER 审核通过结项
│   │   ├── [x] 审核通过后活动状态变为 CLOSED
│   │   ├── [x] 查询结项审核记录
│   │   └── [x] 审核结果通知负责人
│   ├── [x] admin 后台管理接口测试
│   │   └── backend/src/modules/admin/admin.routes.test.ts
│   │   ├── [x] 非 SYS_ADMIN 访问用户管理失败
│   │   ├── [x] 用户列表查询与角色过滤
│   │   ├── [x] 用户详情查询
│   │   ├── [x] 用户状态管理
│   │   ├── [x] dashboard 汇总
│   │   └── [x] 系统日志查询
│   ├── [x] organizations 组织管理接口测试
│   │   └── backend/src/modules/orgs/orgs.routes.test.ts
│   │   ├── [x] 组织列表与类型过滤
│   │   ├── [x] 组织树
│   │   ├── [x] 组织详情
│   │   ├── [x] SYS_ADMIN 创建 / 更新组织
│   │   ├── [x] 用户组织绑定 / 查询 / 解绑
│   │   └── [x] 非 SYS_ADMIN 写操作失败
│   ├── [x] activities 活动列表/start/finish 接口测试
│   │   └── backend/src/modules/activities/activities.routes.test.ts
│   │   ├── [x] 活动列表按状态和关键词过滤
│   │   ├── [x] 活动详情
│   │   ├── [x] 我的活动
│   │   ├── [x] 开始活动
│   │   ├── [x] 结束活动
│   │   ├── [x] 非负责人状态流转失败
│   │   └── [x] 非法状态流转失败
│   ├── [ ] recruitment 招募容量与限制条件补充测试
│   ├── [ ] signup 材料上传、容量满员、限制条件补充测试
│   ├── [ ] closure 退回补材料、拒绝、多级审核补充测试
│   └── [ ] checkin QRCODE 与非负责人补签 / 查看补充测试
│
├── [x] frontend 前端组件/页面测试
│   ├── [x] App 基础页面渲染
│   │   └── frontend/src/app/App.test.tsx
│   ├── [x] 注册页字段渲染
│   │   └── frontend/src/modules/auth/RegisterPage.test.tsx
│   ├── [ ] 登录页字段渲染
│   │   └── 当前在 App.test.tsx 中间接覆盖，建议后续拆成 LoginPage.test.tsx
│   ├── [x] 编辑基础信息页
│   │   └── frontend/src/modules/users/MeEditPage.test.tsx
│   ├── [x] 编辑扩展资料页
│   │   └── frontend/src/modules/users/MeProfilePage.test.tsx
│   │   ├── [x] student 显示 college/major/grade/className
│   │   └── [x] teacher 显示 departmentName/jobTitle
│   ├── [x] 个人信息页
│   │   └── frontend/src/modules/users/MePage.test.tsx
│   │   ├── [x] 展示账号信息、角色和学生 profile
│   │   ├── [x] profile 为空时展示空状态
│   │   └── [x] 点击刷新重新请求当前用户
│   ├── [x] 路由守卫
│   │   └── frontend/src/shared/auth/guards.test.tsx
│   │   ├── [x] 未登录访问受保护页面跳 /login
│   │   └── [x] 已登录正常显示受保护内容
│   ├── [x] 全局布局与登录态
│   │   └── frontend/src/shared/components/AppLayout.test.tsx
│   │   ├── [x] 多角色用户显示角色切换入口
│   │   ├── [x] ORGANIZER 视图显示角色菜单
│   │   └── [x] 退出登录清空 session 并跳转 /login
│   ├── [x] 我的申请页面
│   │   └── frontend/src/modules/activity-applications/MyApplicationsPage.test.tsx
│   │   ├── [x] 渲染申请列表
│   │   ├── [x] 按活动名称搜索
│   │   └── [x] 切换进行中筛选
│   ├── [x] 审核待办页面
│   │   └── frontend/src/modules/approval/ReviewerInboxPage.test.tsx
│   │   ├── [x] 渲染待办列表
│   │   ├── [x] 按活动名称 / 组织搜索
│   │   └── [x] 点击立即审核进入详情路由
│   ├── [x] 审核详情页面
│   │   └── frontend/src/modules/approval/ReviewerDetailPage.test.tsx
│   │   ├── [x] 展示申请详情、附件和审核历史
│   │   ├── [x] 缺少审核意见时阻止确认
│   │   ├── [x] 填写审核意见后打开确认弹窗
│   │   └── [x] 找不到申请时展示空状态
│   ├── [x] 通知中心页面
│   │   └── frontend/src/modules/notifications/NotificationCenterPage.test.tsx
│   │   ├── [x] 未读筛选
│   │   ├── [x] 单条标记已读
│   │   └── [x] 全部标记已读
│   ├── [x] 签到页面
│   │   └── frontend/src/modules/checkin/CheckinPage.test.tsx
│   │   ├── [x] 展示已有签到场次
│   │   ├── [x] 展示签到码
│   │   └── [x] 创建手动签到场次
│   ├── [x] 活动列表 / 详情页面
│   │   └── frontend/src/modules/activities/ActivityPages.test.tsx
│   │   ├── [x] 活动列表状态筛选
│   │   ├── [x] 活动列表关键词搜索
│   │   ├── [x] 活动详情展示报名和签到入口
│   │   └── [x] 活动不存在空状态
│   ├── [x] 招募报名 / 我的报名页面
│   │   └── frontend/src/modules/recruitment/RecruitmentPages.test.tsx
│   │   ├── [x] 已发布招募报名表单
│   │   ├── [x] 未开放报名提示
│   │   ├── [x] 我的报名状态展示
│   │   ├── [x] 审核通过后显示去签到入口
│   │   └── [x] 拒绝理由展示
│   ├── [x] 结项申请页面
│   │   └── frontend/src/modules/closure/ClosureApplyPage.test.tsx
│   │   ├── [x] 结项表单字段渲染
│   │   ├── [x] 附件上传区域渲染
│   │   └── [x] 活动总结长度校验
│   ├── [ ] LoginPage 独立行为测试
│   ├── [ ] RegisterPage 提交成功/失败交互测试
│   ├── [x] MePage 数据展示测试
│   ├── [ ] MeEditPage 保存成功/失败交互测试
│   ├── [ ] MeProfilePage 保存成功/失败交互测试
│   ├── [ ] 招募/报名真实提交交互测试
│   ├── [ ] 结项页面成功提交交互测试
│   └── [ ] admin / sysadmin 页面测试
│
├── [x] frontend E2E 浏览器流程测试
│   ├── [x] 用户注册-资料-退出闭环
│   │   └── frontend/tests/e2e/auth-user-flow.spec.ts
│   │   ├── [x] 打开 /register
│   │   ├── [x] 填写注册表单
│   │   ├── [x] mock register API
│   │   ├── [x] 跳转 /me/profile
│   │   ├── [x] 修改学生 profile
│   │   ├── [x] 跳转 /me
│   │   ├── [x] 退出登录
│   │   └── [x] 再访问 /me 跳转 /login
│   ├── [x] 组织者立项申请前端流程
│   │   └── frontend/tests/e2e/organizer-reviewer-flow.spec.ts
│   │   ├── [x] 注入 ORGANIZER 登录态
│   │   ├── [x] 打开 /applications
│   │   ├── [x] 进入 /applications/new
│   │   └── [x] 空表单提交触发表单校验
│   ├── [x] 审核人处理立项待办前端流程
│   │   └── frontend/tests/e2e/organizer-reviewer-flow.spec.ts
│   │   ├── [x] 注入 REVIEWER 登录态
│   │   ├── [x] 打开 /approvals
│   │   ├── [x] 进入审核详情
│   │   ├── [x] 填写审核意见并打开确认弹窗
│   │   └── [x] 确认通过后返回 /approvals
│   ├── [x] 真实后端联动 E2E
│   │   └── frontend/tests/e2e-real/auth-real-backend.spec.ts
│   │   ├── [x] 启动真实 backend
│   │   ├── [x] 连接真实 PostgreSQL
│   │   ├── [x] 按唯一用户名隔离测试数据
│   │   ├── [x] 浏览器注册真实用户
│   │   ├── [x] 浏览器登录真实用户
│   │   ├── [x] 浏览器修改真实 profile
│   │   ├── [x] 退出后重新登录
│   │   ├── [x] 验证 profile 数据持久化
│   │   ├── [x] 测试结束清理测试数据
│   │   └── [x] 清理后验证测试用户无法登录
│   ├── [ ] 登录已有账号 E2E
│   ├── [ ] 权限申请 E2E
│   ├── [ ] 活动立项 E2E
│   ├── [ ] reviewer 审核 E2E
│   ├── [ ] 招募报名 E2E
│   ├── [ ] 签到 E2E
│   └── [ ] 结项 E2E
│
├── [x] 测试环境配置
│   ├── [x] backend Vitest node 环境
│   ├── [x] frontend Vitest jsdom 环境
│   ├── [x] frontend setup.ts 补 matchMedia / ResizeObserver / getComputedStyle
│   ├── [x] Playwright chromium 配置
│   ├── [x] Vite webServer 自动启动配置
│   ├── [x] 真实后端联调 Playwright 配置
│   │   └── frontend/playwright.real.config.ts
│   ├── [x] 真实后端联调数据清理脚本
│   │   └── backend/src/test/real-e2e-cleanup.ts
│   ├── [ ] 独立测试数据库 campus_test
│   ├── [x] 后端测试 fixture helper
│   │   └── backend/src/test/fixtures.ts
│   ├── [ ] 前端统一 render helper
│   └── [ ] CI 自动化测试配置
│
└── [x] 文档与命令
    ├── [x] README 测试命令更新
    ├── [ ] docs/注册-登录-用户信息管理测试清单.md
    ├── [ ] docs/前端联调问题记录.md
    ├── [ ] docs/用户闭环验收结果说明.md
    └── [ ] docs/测试文件索引.md

---

## 最终版测试计划

本计划按提交报告模板中的测试维度维护：模块/单元测试、模块协作与数据一致性测试、功能验证测试、边界测试、压力测试、用户接口测试、真实后端联调、测试数据隔离、测试资源与命令。后续新增功能时，先在本节登记测试点，再补测试文件与结果。

### 1. 测试目标与质量门禁

├── [x] 核心目标
│   ├── [x] 验证注册、登录、用户资料、角色申请、组织管理、活动立项、审核、招募报名、签到、结项、公告通知等主流程可用
│   ├── [x] 验证后端接口权限、状态流转、数据写入、通知联动与 PostgreSQL 真实持久化
│   ├── [x] 验证前端页面在不同角色下的入口、表单、列表、反馈和路由跳转
│   └── [x] 验证真实后端 + PostgreSQL E2E 具备测试数据隔离和测试完成后的清理能力
├── [x] 当前基础门禁
│   ├── [x] `pnpm --filter @campus-activity/shared test:run`
│   ├── [x] `pnpm --filter @campus-activity/server test:run`
│   ├── [x] `pnpm --filter @campus-activity/web test:run`
│   ├── [x] `pnpm --filter @campus-activity/web test:e2e`
│   ├── [x] `pnpm --filter @campus-activity/web test:e2e:real`
│   ├── [x] `pnpm typecheck`
│   └── [x] `pnpm lint`
├── [ ] CI 门禁补全
│   ├── [ ] 将 shared/backend/frontend Vitest、前端 mock E2E、真实 E2E 分成独立 job
│   ├── [ ] 真实 E2E job 使用独立 PostgreSQL service 与独立测试数据库
│   ├── [ ] 保存 coverage、Playwright trace、screenshot、video 作为失败诊断产物
│   └── [ ] 将 lint 中现有 backend `no-explicit-any` 警告收敛后改为必须无 warning
└── [ ] 覆盖率门禁补全
    ├── [ ] backend 设置 statements/functions/branches/lines 阈值，先按当前覆盖率基线建立，不一次性拔高
    ├── [ ] frontend 当前语句覆盖率约 24.30%，优先补页面交互后再设置阈值
    ├── [ ] shared 设置类型契约覆盖率阈值
    └── [ ] 每次新增模块必须同步登记测试文件、测试点、最近一次结果

### 2. 模块/单元测试计划

├── [x] shared 契约
│   ├── [x] roles/status/http 响应结构基础契约
│   └── [ ] `shared/src/types/*.test.ts` 增加 shared enum 与后端 Prisma enum 的一致性测试
├── [x] backend 路由与服务
│   ├── [x] auth/users/role-applications/activity-applications/approval/recruitment/checkin/closure/announcements/admin/orgs/activities 已有接口测试
│   ├── [ ] `backend/src/modules/auth/auth.routes.test.ts`
│   │   ├── [ ] 被封禁用户登录失败
│   │   ├── [ ] 用户状态变更后旧 token 访问受保护接口失败
│   │   └── [ ] email/phone 重复注册或更新冲突
│   ├── [ ] `backend/src/modules/users/users.routes.test.ts`
│   │   ├── [ ] `/users/me/roles` 返回角色、当前角色、组织绑定
│   │   ├── [ ] 更新 email/phone 与其他用户冲突失败
│   │   └── [ ] BASIC_USER 无权限访问管理字段
│   ├── [ ] `backend/src/modules/activity-applications/activity-applications.routes.test.ts`
│   │   ├── [ ] 附件上传、查询、删除
│   │   ├── [ ] 申请详情权限：申请人、审核人、无关用户
│   │   ├── [ ] 审核拒绝、退回补材料、重复提交
│   │   └── [ ] 最终审核通过后创建 activity 并写入负责人、组织、状态
│   ├── [ ] `backend/src/modules/approval/approval.routes.test.ts`
│   │   ├── [ ] 待办详情
│   │   ├── [ ] 待办处理成功写入 approval record
│   │   ├── [ ] 非分配审核人查看或处理失败
│   │   └── [ ] 已处理待办重复处理失败
│   ├── [ ] `backend/src/modules/pending-tasks/*.test.ts`
│   │   ├── [ ] 待办列表按类型、状态、分配人过滤
│   │   ├── [ ] 待办详情聚合业务对象摘要
│   │   ├── [ ] 非分配用户不可查看待办详情
│   │   └── [ ] 业务对象被处理后待办状态同步
│   ├── [ ] `backend/src/modules/recruitment/recruitment-signups.routes.test.ts`
│   │   ├── [ ] 容量满员后报名失败
│   │   ├── [ ] 报名开始前和结束后报名失败
│   │   ├── [ ] allowed user type / grade / major 限制
│   │   ├── [ ] 报名材料上传、下载、权限校验
│   │   ├── [ ] 报名详情权限：申请人、负责人、无关用户
│   │   └── [ ] 已发布招募不可修改关键规则
│   ├── [ ] `backend/src/modules/checkin/checkin.routes.test.ts`
│   │   ├── [ ] QRCODE 场次创建、开启、扫码签到
│   │   ├── [ ] 非负责人创建、开启、关闭、补签、查看记录均失败
│   │   ├── [ ] 签到开始/结束时间边界
│   │   └── [ ] 未通过报名、取消报名、非活动成员均无法签到
│   ├── [ ] `backend/src/modules/closure/closure.routes.test.ts`
│   │   ├── [ ] 结项附件上传和权限
│   │   ├── [ ] 审核拒绝、退回补材料、多级审核
│   │   ├── [ ] 非负责人提交失败
│   │   └── [ ] 已结项活动重复提交失败
│   ├── [ ] `backend/src/modules/announcements/announcements.routes.test.ts`
│   │   ├── [ ] 公告更新、归档、置顶、分类过滤
│   │   ├── [ ] 公告详情权限
│   │   └── [ ] 公告与通知分页一致性
│   ├── [ ] `backend/src/modules/admin/admin.routes.test.ts`
│   │   ├── [ ] 角色申请列表、状态过滤、审核入口
│   │   ├── [ ] 用户分页边界
│   │   └── [ ] 非法目标用户和非法状态错误信息
│   └── [ ] `backend/src/modules/orgs/orgs.routes.test.ts`
│       ├── [ ] 重复组织绑定失败
│       ├── [ ] 绑定不存在用户或组织失败
│       └── [ ] 删除/解绑后相关查询一致
└── [x] frontend 页面与组件
    ├── [x] 已覆盖 App、注册页字段、个人资料、布局、路由守卫、活动、招募、签到、通知、审核、结项表单
    ├── [ ] `frontend/src/modules/auth/LoginPage.test.tsx`
    │   ├── [ ] 登录成功保存 session 并跳转
    │   ├── [ ] 登录失败展示后端错误
    │   ├── [ ] loading 状态禁止重复提交
    │   └── [ ] 已登录访问登录页的跳转行为
    ├── [ ] `frontend/src/modules/auth/RegisterPage.test.tsx`
    │   ├── [ ] 注册成功跳转资料页
    │   ├── [ ] 注册失败展示错误
    │   └── [ ] 学生/教师字段切换与校验
    ├── [ ] `frontend/src/modules/users/MeEditPage.test.tsx`
    │   ├── [ ] 保存成功刷新用户信息
    │   └── [ ] 保存失败展示错误并保留表单输入
    ├── [ ] `frontend/src/modules/users/MeProfilePage.test.tsx`
    │   ├── [ ] 学生 profile 保存成功/失败
    │   └── [ ] 教师 profile 保存成功/失败
    ├── [ ] `frontend/src/modules/activity-applications/*.test.tsx`
    │   ├── [ ] 新建立项表单提交成功
    │   ├── [ ] 附件上传成功/失败
    │   └── [ ] 草稿保存、提交审核、错误反馈
    ├── [ ] `frontend/src/modules/approval/*.test.tsx`
    │   ├── [ ] 真实 API loading/empty/error 状态
    │   ├── [ ] 审核拒绝、退回补材料交互
    │   └── [ ] 无权限详情页反馈
    ├── [ ] `frontend/src/modules/recruitment/*.test.tsx`
    │   ├── [ ] 招募创建/编辑/发布/关闭页面
    │   ├── [ ] 报名表单真实提交、附件、限制提示
    │   └── [ ] 报名审核页面通过/拒绝
    ├── [ ] `frontend/src/modules/closure/*.test.tsx`
    │   ├── [ ] 结项提交成功
    │   ├── [ ] 结项审核列表与详情
    │   └── [ ] 拒绝、退回补材料、错误反馈
    ├── [ ] `frontend/src/modules/admin/*.test.tsx`
    │   ├── [ ] 系统管理员用户、日志、dashboard 页面
    │   └── [ ] 无权限角色看不到管理入口
    ├── [ ] `frontend/src/modules/organizations/*.test.tsx`
    │   ├── [ ] 组织列表、组织树、组织详情
    │   └── [ ] 组织绑定/解绑成功失败反馈
    ├── [ ] `frontend/src/modules/permissions/*.test.tsx`
    │   ├── [ ] 角色申请列表、详情、审核
    │   └── [ ] 状态筛选与分页
    └── [ ] `frontend/src/modules/tasks/*.test.tsx`
        ├── [ ] 审核待办管理页面
        └── [ ] 无权限用户直接访问路由被拒绝

### 3. 模块协作与数据一致性测试计划

├── [x] 已覆盖协作链路
│   ├── [x] 角色申请审核通过后写入 `user_roles` 与 `user_organizations`
│   ├── [x] 活动立项提交后创建 reviewer pending task
│   ├── [x] 招募发布后活动进入 `RECRUITING`
│   ├── [x] 学生报名后创建 `SIGNUP_REVIEW` 待办
│   ├── [x] 报名审核结果通知申请人
│   ├── [x] 签到统计基于已通过报名人数
│   ├── [x] 结项审核通过后活动状态变为 `CLOSED`
│   └── [x] 公告发布后生成用户通知
├── [ ] 立项完整协作链路
│   ├── [ ] 目标文件：`backend/src/modules/activity-applications/activity-applications.routes.test.ts`
│   ├── [ ] 场景：组织者创建草稿 -> 提交 -> 审核人待办 -> 通过 -> activity 创建
│   ├── [ ] 断言：application status、pending task status、approval record、activity status、activity owner、notification
│   └── [ ] 清理：按测试唯一前缀删除 application/activity/task/notification/user/org 相关数据
├── [ ] 报名完整协作链路
│   ├── [ ] 目标文件：`backend/src/modules/recruitment/recruitment-signups.routes.test.ts`
│   ├── [ ] 场景：负责人发布招募 -> 学生报名 -> 待办生成 -> 负责人审核 -> 通知申请人
│   ├── [ ] 断言：signup status、pending task status、activity participant/统计、notification unread count
│   └── [ ] 增加容量、时间窗、限制条件的失败链路
├── [ ] 签到完整协作链路
│   ├── [ ] 目标文件：`backend/src/modules/checkin/checkin.routes.test.ts`
│   ├── [ ] 场景：通过报名 -> 创建签到场次 -> 开启 -> 签到 -> 查询记录 -> 关闭
│   ├── [ ] 断言：只有通过报名用户可以签到，重复签到冲突，关闭后不可签到
│   └── [ ] 增加 QRCODE 与 MANUAL 两类场次的差异断言
├── [ ] 结项完整协作链路
│   ├── [ ] 目标文件：`backend/src/modules/closure/closure.routes.test.ts`
│   ├── [ ] 场景：负责人提交结项 -> reviewer 待办 -> 通过/拒绝/退回 -> 通知负责人
│   ├── [ ] 断言：closure application、approval record、pending task、activity status、notification 一致
│   └── [ ] 增加已关闭活动重复结项失败
└── [ ] 管理端一致性链路
    ├── [ ] 目标文件：`backend/src/modules/admin/admin.routes.test.ts` 与 `backend/src/modules/orgs/orgs.routes.test.ts`
    ├── [ ] 场景：系统管理员调整用户状态/角色/组织绑定后，普通接口权限同步变化
    └── [ ] 断言：角色切换、菜单入口、后端权限校验、旧数据查询结果一致

### 4. 功能验证测试计划

├── [x] 已验证功能闭环
│   ├── [x] mock 前端注册-资料-退出闭环
│   ├── [x] mock 组织者立项表单校验
│   ├── [x] mock 审核人处理待办流程
│   └── [x] 真实后端 + PostgreSQL 注册、登录、资料持久化、清理
├── [ ] 权限申请功能验证
│   ├── [ ] 后端：BASIC_USER 提交 ORGANIZER 申请，SYS_ADMIN 审核通过，用户重新登录后角色生效
│   ├── [ ] 前端：申请页、我的申请列表、管理员审核页、角色切换入口
│   └── [ ] E2E：`frontend/tests/e2e-real/role-application-real-backend.spec.ts`
├── [ ] 活动立项功能验证
│   ├── [ ] 后端：草稿、编辑、提交、审核通过、活动生成
│   ├── [ ] 前端：立项表单、我的申请、审核详情、状态反馈
│   └── [ ] E2E：`frontend/tests/e2e-real/activity-application-real-backend.spec.ts`
├── [ ] 招募报名功能验证
│   ├── [ ] 后端：创建招募、发布、学生报名、负责人审核、通知
│   ├── [ ] 前端：招募列表、报名详情、我的报名、报名审核
│   └── [ ] E2E：`frontend/tests/e2e-real/recruitment-signup-real-backend.spec.ts`
├── [ ] 签到功能验证
│   ├── [ ] 后端：创建场次、开启、签到、记录、关闭
│   ├── [ ] 前端：签到码展示、学生签到、记录列表、失败提示
│   └── [ ] E2E：`frontend/tests/e2e-real/checkin-real-backend.spec.ts`
├── [ ] 结项功能验证
│   ├── [ ] 后端：提交结项、审核、通知、活动关闭
│   ├── [ ] 前端：结项申请、结项审核、结项状态
│   └── [ ] E2E：`frontend/tests/e2e-real/closure-real-backend.spec.ts`
└── [ ] 公告通知功能验证
    ├── [ ] 后端：公告发布、通知生成、未读统计、标记已读
    ├── [ ] 前端：通知中心空态、未读筛选、批量已读、详情跳转
    └── [ ] E2E：可并入真实流程，验证每条审核结果都有通知

### 5. 边界测试计划

├── [ ] 输入边界
│   ├── [ ] 缺少必填字段：注册、登录、立项、招募、报名、签到、结项、公告
│   ├── [ ] 字符长度：username、realName、title、description、summary、review comment
│   ├── [ ] 非法枚举：role、status、userType、activityStatus、taskType
│   ├── [ ] 非法 ID：不存在、属于其他用户、格式错误
│   └── [ ] 非法日期：开始晚于结束、报名窗口不在活动时间内、签到窗口已过
├── [ ] 状态边界
│   ├── [ ] 草稿、待审核、退回、拒绝、通过之间的非法流转
│   ├── [ ] 已关闭招募不可报名
│   ├── [ ] 已结束活动不可开启签到
│   ├── [ ] 已关闭签到场次不可重复开启或签到
│   └── [ ] 已结项活动不可再次结项
├── [ ] 权限边界
│   ├── [ ] 未登录、错误 token、过期 token、被封禁用户
│   ├── [ ] BASIC_USER 调用组织者、审核人、管理员接口
│   ├── [ ] ORGANIZER 操作非本人组织或非本人活动
│   ├── [ ] REVIEWER 处理未分配给自己的待办
│   └── [ ] SYS_ADMIN 以外用户访问用户/组织/日志管理
├── [ ] 数据边界
│   ├── [ ] 重复 username/email/phone
│   ├── [ ] 重复组织绑定
│   ├── [ ] 重复报名、重复签到、重复审核、重复结项
│   ├── [ ] 招募容量为 0、容量满、容量刚好剩 1
│   └── [ ] 分页第一页、最后一页、空结果、超大 pageSize
└── [ ] 文件与网络边界
    ├── [ ] 上传空文件、超大文件、不支持类型
    ├── [ ] 附件删除后不可访问
    ├── [ ] 前端上传中断或后端返回 4xx/5xx
    └── [ ] 前端请求超时、网络失败、重复点击提交

### 6. 压力与性能测试计划

├── [ ] 工具选择
│   ├── [ ] 后端 HTTP 压测使用 `k6` 或 `autocannon`
│   ├── [ ] 前端页面性能使用 Playwright trace 和浏览器 performance timing
│   └── [ ] 数据库使用独立测试库与可重复 seed，压测完成后清理
├── [ ] 后端压测场景
│   ├── [ ] 登录：固定测试用户池并发登录，验证 token 签发延迟和失败率
│   ├── [ ] 活动列表：关键词、状态、分页查询在并发下的 p95 延迟
│   ├── [ ] 招募报名：并发报名同一招募，验证容量不超卖
│   ├── [ ] 通知列表：大量通知分页与未读统计
│   └── [ ] 签到提交：并发签到同一场次，验证重复签到冲突和成功记录唯一性
├── [ ] 建议性能指标
│   ├── [ ] 单接口 p95 延迟不超过 800 ms
│   ├── [ ] 错误率不超过 1%，业务预期冲突响应单独统计
│   ├── [ ] 容量、签到、审核类写操作无重复写入和脏数据
│   └── [ ] 压测后数据库清理脚本可验证无测试前缀残留
└── [ ] 目标文件
    ├── [ ] `scripts/perf/login.k6.ts`
    ├── [ ] `scripts/perf/activity-list.k6.ts`
    ├── [ ] `scripts/perf/recruitment-signup.k6.ts`
    ├── [ ] `scripts/perf/checkin.k6.ts`
    └── [ ] `docs/performance-test-results.md`

### 7. 用户接口测试计划

├── [x] 已覆盖
│   ├── [x] 路由守卫
│   ├── [x] 多角色布局入口
│   ├── [x] 个人信息展示
│   ├── [x] 活动列表/详情
│   ├── [x] 招募报名状态
│   ├── [x] 审核详情基本交互
│   ├── [x] 签到页面基础展示
│   └── [x] 通知中心标记已读
├── [ ] 角色可见性
│   ├── [ ] BASIC_USER 只能看到个人、活动、招募、通知等入口
│   ├── [ ] ORGANIZER 看到立项、招募、签到、结项入口
│   ├── [ ] REVIEWER 看到审核待办入口
│   ├── [ ] SYS_ADMIN 看到用户、组织、角色申请、日志入口
│   └── [ ] 无权限页面不只隐藏按钮，直接访问路由也要有错误或跳转
├── [ ] 反馈与可用性
│   ├── [ ] 每个提交表单有 loading、成功、失败、字段校验
│   ├── [ ] 列表页面有 loading、empty、error、pagination
│   ├── [ ] 审核类操作有确认弹窗和操作后状态刷新
│   ├── [ ] 上传组件有进度、失败、删除、重试或明确错误
│   └── [ ] 通知/审核/报名状态有清晰标签，失败原因可见
├── [ ] 浏览器 E2E 可视验证
│   ├── [ ] 对注册、立项、审核、报名、签到、结项关键页面保存截图
│   ├── [ ] 移动端宽度验证表单不溢出、按钮不重叠
│   ├── [ ] 桌面端验证菜单、表格、详情区信息密度正常
│   └── [ ] Playwright 失败时保留 trace/screenshot/video
└── [ ] 无障碍与键盘操作
    ├── [ ] 表单字段 label 与错误提示可被测试查询
    ├── [ ] Modal、Dropdown、Tabs 支持键盘基本操作
    └── [ ] 关键按钮 disabled/loading 状态可感知

### 8. 真实后端 + PostgreSQL E2E 计划

├── [x] 当前已实现
│   ├── [x] `frontend/tests/e2e-real/auth-real-backend.spec.ts`
│   ├── [x] 真实注册、登录、资料修改、退出、重新登录
│   ├── [x] 使用唯一用户名隔离测试数据
│   ├── [x] 测试结束调用清理 helper
│   └── [x] 清理后验证测试用户无法登录
├── [ ] 数据隔离标准化
│   ├── [ ] 统一测试前缀：`e2e_<timestamp>_<workerIndex>_`
│   ├── [ ] 所有真实 E2E 创建的 username、email、organization code、activity title、recruitment title 使用唯一前缀
│   ├── [ ] 清理 helper 按前缀删除 notification、approval record、pending task、signup、checkin、closure、activity、organization、user 等数据
│   ├── [ ] 清理顺序按外键依赖从子表到父表
│   └── [ ] 清理后增加残留检测，发现残留直接失败
├── [ ] 真实 E2E 用例补全
│   ├── [ ] `frontend/tests/e2e-real/role-application-real-backend.spec.ts`
│   │   ├── [ ] BASIC_USER 提交组织者申请
│   │   ├── [ ] SYS_ADMIN 审核通过
│   │   └── [ ] 用户重新登录后 ORGANIZER 入口出现
│   ├── [ ] `frontend/tests/e2e-real/activity-application-real-backend.spec.ts`
│   │   ├── [ ] ORGANIZER 创建并提交立项
│   │   ├── [ ] REVIEWER 审核通过
│   │   └── [ ] 活动列表出现新活动
│   ├── [ ] `frontend/tests/e2e-real/recruitment-signup-real-backend.spec.ts`
│   │   ├── [ ] ORGANIZER 发布招募
│   │   ├── [ ] STUDENT 报名
│   │   ├── [ ] ORGANIZER 审核通过
│   │   └── [ ] STUDENT 我的报名状态更新
│   ├── [ ] `frontend/tests/e2e-real/checkin-real-backend.spec.ts`
│   │   ├── [ ] ORGANIZER 创建并开启签到
│   │   ├── [ ] STUDENT 完成签到
│   │   └── [ ] ORGANIZER 记录列表出现该学生
│   ├── [ ] `frontend/tests/e2e-real/closure-real-backend.spec.ts`
│   │   ├── [ ] ORGANIZER 提交结项
│   │   ├── [ ] REVIEWER 审核通过
│   │   └── [ ] 活动状态变为已结项
│   └── [ ] `frontend/tests/e2e-real/permission-negative-real-backend.spec.ts`
│       ├── [ ] 未登录访问受保护页面跳转登录
│       ├── [ ] BASIC_USER 直接访问管理页被拒绝
│       └── [ ] 无关用户无法处理他人的审核/报名/签到数据
└── [ ] 运行指令
    ├── [x] `pnpm --filter @campus-activity/web test:e2e:real`
    ├── [ ] `pnpm --filter @campus-activity/web test:e2e:real -- --project=chromium`
    └── [ ] CI 中真实 E2E 独立运行，失败不影响单元测试产物收集

### 9. 测试数据、资源与结果记录

├── [x] 当前资源
│   ├── [x] Docker PostgreSQL/Redis 环境可用于后端测试与真实 E2E
│   ├── [x] backend/frontend/shared coverage HTML 已生成过
│   └── [x] 真实 E2E 已具备基本清理 helper
├── [ ] 独立测试库
│   ├── [ ] 使用 `campus_test` 或等价测试数据库，避免与开发数据混用
│   ├── [ ] 测试前运行 migration/seed
│   ├── [ ] 测试后按唯一前缀清理本次创建数据
│   └── [ ] 禁止真实 E2E 依赖人工预置的可变数据
├── [ ] 结果记录格式
│   ├── [ ] 每次新增测试在本文件对应节点勾选
│   ├── [ ] 在 `docs/testing-maintenance.md` 记录最近一次完整验证命令、通过数量、失败原因和未覆盖风险
│   ├── [ ] 性能测试结果独立记录到 `docs/performance-test-results.md`
│   └── [ ] 失败问题需要包含复现命令、环境、预期结果、实际结果、后续处理
└── [ ] 资源消耗记录
    ├── [ ] 单元测试总耗时
    ├── [ ] mock E2E 总耗时
    ├── [ ] 真实 E2E 总耗时
    ├── [ ] 压测并发数、持续时间、请求总量、p95、错误率
    └── [ ] 数据库清理前后残留数量

### 10. 建议补测顺序

├── [ ] 第一批：补齐后端高风险边界
│   ├── [ ] shared/Prisma enum 一致性
│   ├── [ ] auth/users 封禁、重复 email/phone、角色查询
│   ├── [ ] approval 待办详情、处理、重复处理、非分配审核人
│   ├── [ ] recruitment 容量、报名时间窗、限制条件
│   ├── [ ] checkin QRCODE、非负责人权限、时间边界
│   └── [ ] closure 拒绝、退回、重复结项
├── [ ] 第二批：补齐前端交互测试
│   ├── [ ] LoginPage/RegisterPage 成功失败提交
│   ├── [ ] MeEditPage/MeProfilePage 保存成功失败
│   ├── [ ] 立项、招募、报名、结项表单提交与错误反馈
│   ├── [ ] 审核拒绝/退回补材料
│   └── [ ] 管理端页面和角色入口
├── [ ] 第三批：扩展真实 E2E
│   ├── [ ] 权限申请 -> 管理员审核 -> 角色生效
│   ├── [ ] 立项 -> 审核 -> 活动生成
│   ├── [ ] 招募 -> 报名 -> 审核 -> 通知
│   ├── [ ] 签到 -> 记录
│   └── [ ] 结项 -> 审核 -> 活动关闭
└── [ ] 第四批：压力、性能、UI 可视回归
    ├── [ ] 登录、活动列表、招募报名、通知列表、签到提交压测
    ├── [ ] Playwright 截图和 trace 归档
    ├── [ ] 移动端/桌面端关键页面布局验证
    └── [ ] 覆盖率阈值和 CI job 固化
