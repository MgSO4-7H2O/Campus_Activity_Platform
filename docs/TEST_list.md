测试体系
├── [x] shared 共享契约测试
│   ├── [x] roles 枚举基础测试
│   │   └── shared/src/types/roles.test.ts
│   ├── [ ] statuses 状态枚举测试
│   ├── [ ] API 响应结构测试
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
│   ├── [ ] admin 权限申请接口测试
│   │   ├── [ ] 申请 ORGANIZER
│   │   ├── [ ] 申请 REVIEWER 时必须是 teacher
│   │   ├── [ ] REVIEWER/ORGANIZER 必须绑定组织
│   │   ├── [ ] SYS_ADMIN 审核通过后写入 user_roles
│   │   └── [ ] 审核通过后写入 user_organizations
│   ├── [ ] activity-applications 活动立项接口测试
│   ├── [ ] approval 待办与审核流转测试
│   ├── [ ] recruitment 招募测试
│   ├── [ ] signup 报名测试
│   ├── [ ] checkin 签到测试
│   ├── [ ] closure 结项测试
│   └── [ ] notifications 通知测试
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
│   ├── [x] 路由守卫
│   │   └── frontend/src/shared/auth/guards.test.tsx
│   │   ├── [x] 未登录访问受保护页面跳 /login
│   │   └── [x] 已登录正常显示受保护内容
│   ├── [x] 全局布局与登录态
│   │   └── frontend/src/shared/components/AppLayout.test.tsx
│   │   ├── [x] 多角色用户显示角色切换入口
│   │   ├── [x] ORGANIZER 视图显示角色菜单
│   │   └── [x] 退出登录清空 session 并跳转 /login
│   ├── [ ] LoginPage 独立行为测试
│   ├── [ ] RegisterPage 提交成功/失败交互测试
│   ├── [ ] MePage 数据展示测试
│   ├── [ ] MeEditPage 保存成功/失败交互测试
│   ├── [ ] MeProfilePage 保存成功/失败交互测试
│   └── [ ] 其他 mock 原型页面测试
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
│   ├── [ ] 真实后端联动 E2E
│   │   ├── [ ] 启动真实 backend
│   │   ├── [ ] 连接真实 PostgreSQL
│   │   ├── [ ] 准备测试数据库或测试 seed
│   │   ├── [ ] 浏览器注册真实用户
│   │   ├── [ ] 浏览器登录真实用户
│   │   ├── [ ] 浏览器修改真实 profile
│   │   └── [ ] 测试结束清理测试数据
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
│   ├── [x] frontend setup.ts 补 matchMedia / ResizeObserver
│   ├── [x] Playwright chromium 配置
│   ├── [x] Vite webServer 自动启动配置
│   ├── [ ] 独立测试数据库 campus_test
│   ├── [ ] 后端测试 fixture helper
│   ├── [ ] 前端统一 render helper
│   └── [ ] CI 自动化测试配置
│
└── [x] 文档与命令
    ├── [x] README 测试命令更新
    ├── [ ] docs/注册-登录-用户信息管理测试清单.md
    ├── [ ] docs/前端联调问题记录.md
    ├── [ ] docs/用户闭环验收结果说明.md
    └── [ ] docs/测试文件索引.md
