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
