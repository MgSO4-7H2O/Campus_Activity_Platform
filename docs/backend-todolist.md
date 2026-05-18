# 后端 TODO 清单（前端联调视角）

> 截至 2026-05-18，前端已完成 14 个子模块的全部页面与 API 客户端骨架，并保留 Mock fallback。
> 后端可严格按本清单 + [`api-contract.md`](./api-contract.md) 实现，前端无需再做适配。
>
> 命名与字段约定见 `frontend/src/shared/api/dto.ts`（前后端共同事实来源）。
> 所有响应**统一**返回：
> ```json
> { "data": <payload>, "meta": { ... 可选 ... } }
> ```
> 错误响应统一返回：
> ```json
> { "error": { "code": "INVALID_BODY", "message": "human readable", "details": ... } }
> ```

## 优先级里程碑

按 `子模块开发顺序.docx` 中"推荐里程碑"对齐，前端代码路径已经全部就绪，**后端按里程碑顺序实现，每个里程碑结束后即可联调**：

### M1：权限与组织基础（建议 5.18 ~ 5.22）

> 目标：登录后可以申请角色、查看组织树、看到待办列表。

- [x] **1. role-applications**
  - `POST /api/v1/role-applications`
  - `GET /api/v1/role-applications/me`
  - `GET /api/v1/role-applications/:id`
  - `GET /api/v1/admin/role-applications?status=&page=&pageSize=`
  - `POST /api/v1/role-applications/:id/review`（审核通过时写入 `user_roles`，REVIEWER/ORGANIZER 同时写 `user_organizations`）
- [ ] **2. organizations**
  - `GET /api/v1/organizations`
  - `GET /api/v1/organizations/tree`（关键：包含 parent/children）
  - `GET /api/v1/organizations/:id`
  - `POST /api/v1/admin/organizations`
  - `PATCH /api/v1/admin/organizations/:id`
  - `POST /api/v1/admin/users/:id/organizations`
  - `DELETE /api/v1/admin/users/:id/organizations/:organizationId`
  - **必须**在 seed 中预置审核组织：`校党委宣传部 / 校团委 / 学工部 / 社团指导中心 / 各院系团委`
- [ ] **3. pending-tasks** （统一待办，后续审核模块都依赖）
  - `GET /api/v1/pending-tasks/me?status=PENDING|PROCESSED|CANCELLED`
  - `GET /api/v1/pending-tasks/:id`
  - `PATCH /api/v1/pending-tasks/:id/process`
  - 内部 service：`createPendingTask / markTaskProcessed / cancelPendingTask`，通过 `related_resource_type + related_resource_id` 关联业务对象。

**M1 验收**：`pnpm --filter @campus-activity/web doctor` 全绿；登录普通用户 → `/permissions/apply` 提交申请 → 切到 admin → `/admin/role-applications` 审核通过 → 用户角色发生变化 → `/tasks` 出现新的待办。

### M2：立项申请到活动生成（建议 5.23 ~ 5.30）

> 目标：ORGANIZER 提交立项 → REVIEWER 按动态规则审核 → 通过后生成 `activities`。

- [ ] **4. activity-applications**
  - `POST /api/v1/activity-applications`（草稿 / 直接保存）
  - `GET  /api/v1/activity-applications/me?status=&page=&pageSize=`
  - `GET  /api/v1/activity-applications/:id`
  - `PATCH /api/v1/activity-applications/:id`
  - `POST /api/v1/activity-applications/:id/attachments`（multipart/form-data）
  - `DELETE /api/v1/activity-applications/:id/attachments/:attachmentId`
  - `POST /api/v1/activity-applications/:id/submit`（草稿 → SUBMITTED，并创建第一级待办）
- [ ] **5. 审核服务**（核心：动态审核规则）
  - `GET  /api/v1/approval/activity-applications/:id`
  - `POST /api/v1/approval/activity-applications/:id/review`
  - `GET  /api/v1/activity-applications/:id/approval-records`
  - 内部 service：
    - `resolveApprovalOrganizations(applicantOrgId)`：根据 docx 表 15 给出两级审核组织
    - `findReviewerByOrganization(orgId)`：从该组织取任意可用 REVIEWER
    - `reviewActivityApplication(...)`：写 `approval_records` + 关闭当前 `pending_tasks` + 决定下一步
    - `createActivityFromApplication(...)`：终审通过时同步创建 `activities`
  - **务必写单测**（动态审核规则错一处全流程崩）。

**M2 验收**：organizer1 提交 1 条立项 → reviewer1 审核（要求补材料 → 再次提交 → 通过）→ `/activities` 列表中出现新活动，状态 PLANNED。

### M3：招募、报名、审核（建议 5.31 ~ 6.5）

- [ ] **6. activities**
  - `GET /api/v1/activities?status=&keyword=&page=&pageSize=`
  - `GET /api/v1/activities/me`
  - `GET /api/v1/activities/:id`
  - `POST /api/v1/activities/:id/start`（PLANNED|RECRUITING → ONGOING）
  - `POST /api/v1/activities/:id/finish`（ONGOING → FINISHED）
- [ ] **7. recruitments**
  - `POST /api/v1/recruitments`
  - `GET  /api/v1/recruitments?status=&page=`
  - `GET  /api/v1/recruitments/:id`
  - `PATCH /api/v1/recruitments/:id`（仅 DRAFT 可编辑）
  - `POST /api/v1/recruitments/:id/publish`
  - `POST /api/v1/recruitments/:id/close`
  - **注意**：`recruitment_allowed_majors` 为空表示不限制专业，不要 seed 出"所有专业"。
- [ ] **8. signups**
  - `POST   /api/v1/recruitments/:id/signups`（5 重校验：发布、时间、用户类型、年级、专业、重复报名、`requires_attachment`）
  - `GET    /api/v1/signups/me`
  - `GET    /api/v1/recruitments/:id/signups`（ORGANIZER 视角）
  - `GET    /api/v1/signups/:id`
  - `POST   /api/v1/signups/:id/review`
  - `POST   /api/v1/signups/:id/cancel`
  - `POST   /api/v1/signups/:id/attachments`（multipart）

**M3 验收**：organizer1 创建招募并发布 → student1 在 `/activities/:id/register` 报名 → organizer1 在 `/activities/:id/registrations` 审核通过 → 报名者 `/my/registrations` 看到 APPROVED。

### M4：签到与结项（建议 6.6 ~ 6.10）

- [ ] **9. checkin**
  - `POST /api/v1/checkin-sessions`
  - `GET  /api/v1/activities/:id/checkin-sessions`
  - `POST /api/v1/checkin-sessions/:id/open`
  - `POST /api/v1/checkin-sessions/:id/close`
  - `POST /api/v1/checkin-sessions/:id/checkin`（用户）
  - `GET  /api/v1/checkin-sessions/:id/records`
  - `POST /api/v1/checkin-sessions/:id/manual-records`（手动补签）
  - 状态仅支持 `CHECKED_IN / LATE`，不存 `ABSENT`。
- [ ] **10. closures**
  - `POST  /api/v1/closure-applications`
  - `GET   /api/v1/closure-applications/me`
  - `GET   /api/v1/closure-applications/:id`
  - `PATCH /api/v1/closure-applications/:id`
  - `POST  /api/v1/closure-applications/:id/attachments`
  - `POST  /api/v1/closure-applications/:id/submit`
  - `POST  /api/v1/closure-applications/:id/review`
  - `GET   /api/v1/closure-applications/:id/review-records`
  - **复用** M2 的 `resolveApprovalOrganizations / findReviewerByOrganization`，不要重写。终审通过时把活动置为 `CLOSED`。

### M5：公告、通知、管理后台、日志（建议 6.11 ~ 6.15）

- [ ] **11. announcements**
  - `GET   /api/v1/announcements?category=&pinned=&page=`
  - `GET   /api/v1/announcements/:id`
  - `POST  /api/v1/announcements`
  - `PATCH /api/v1/announcements/:id`
  - `POST  /api/v1/announcements/:id/publish`
  - `POST  /api/v1/announcements/:id/archive`
- [ ] **12. notifications**
  - `GET   /api/v1/notifications?read=&page=`
  - `GET   /api/v1/notifications/unread-count`
  - `PATCH /api/v1/notifications/:id/read`
  - `PATCH /api/v1/notifications/read-all`
  - 内部 service：`notifyUser / notifyRole / notifyOrganization / markAsRead`
  - **触发点**（前端无需感知，后端在以下场景内部调用 `notifyUser`）：
    - 权限申请审核结果
    - 立项提交成功、立项每级审核结果
    - 报名提交成功、报名审核结果
    - 签到开启提醒（按招募已通过用户）
    - 结项审核结果
- [ ] **13. admin / system-logs**
  - `GET   /api/v1/admin/users?keyword=&role=&status=&page=`
  - `GET   /api/v1/admin/users/:id`
  - `PATCH /api/v1/admin/users/:id/status`
  - `GET   /api/v1/admin/system-logs?action=&actorId=&from=&to=&page=`
  - `GET   /api/v1/admin/dashboard`
  - 关键操作写入 `system_logs`：登录、注册、权限/活动/结项审批、报名审核、签到开启、公告发布。

## 必读约定

1. **响应包裹**：所有 2xx 返回 `{ data, meta? }`；非 2xx 返回 `{ error: { code, message, details? } }`。前端 `getApiErrorMessage` 仅识别这个格式。
2. **认证**：除 `/auth/login`、`/auth/register`、`/health`、`/announcements`、`/activities`、`/organizations*` 公共路径之外，所有接口需要 `Authorization: Bearer <token>` JWT。
3. **分页**：列表接口默认 `pageSize=20`，返回 `{ items, total, page, pageSize }` 结构（见 `Paginated<T>` DTO）。
4. **时间格式**：ISO 8601 字符串（UTC），前端用 `dayjs` 转本地时区显示。
5. **文件上传**：`multipart/form-data`，字段名 `file`，返回新增的附件 DTO。
6. **错误码（建议）**：`UNAUTHORIZED / FORBIDDEN / NOT_FOUND / INVALID_BODY / CONFLICT / TRANSITION_NOT_ALLOWED`。
7. **状态机**：参考 `dto.ts` 中各 `*Status` 枚举；非法状态转换需返回 `TRANSITION_NOT_ALLOWED`，前端会展示错误消息。

## seed 数据

后端 seed 至少需要：

- 4 个账号（密码统一 `Password123!`）：`student1 / organizer1 / reviewer1 / admin`，角色与组织绑定见 `frontend/src/shared/mock/data.ts` 的 `fallbackAdminUsers`。
- 组织树：见 `fallbackOrgTree`（包含校党委宣传部 → 校团委 / 学工部 → 学院/社团指导中心 → 各社团）。
- 至少 1 条已通过的 `activity_applications` + 对应 `activities`，让 organizer1 登录后能看到我的活动。

## 联调用法

前端环境体检：

```bash
pnpm --filter @campus-activity/web doctor
```

会检查：前端 dev 是否在线 → 后端 health → 4 个 seed 账号能否登录。任何一项失败会给出修复提示。

截图（用于答辩材料）：

```bash
pnpm --filter @campus-activity/web screenshots
# 仅公开页面：
pnpm --filter @campus-activity/web screenshots --no-auth
# 单页调试：
pnpm --filter @campus-activity/web screenshots --filter "admin-dashboard"
```

## 联系前端

- 接口字段如需调整，请**先改 `frontend/src/shared/api/dto.ts` 与 `docs/api-contract.md`**，再由后端跟进。
- 任何状态机修改请同步到 docx 表 11 的状态流转图。
