# API 契约（前后端联调单一事实来源）

> 本文档与 `frontend/src/shared/api/dto.ts` 保持一致。**任何字段变动请双向同步。**
>
> 路径前缀：`/api/v1`
> 鉴权：除 `auth/*`、`announcements (GET)`、`activities (GET)`、`organizations*` 公共接口外，
> 其余接口需 `Authorization: Bearer <accessToken>`。
>
> 响应统一：
> ```json
> { "data": <payload>, "meta": { "page": 1, "pageSize": 20, "total": 100 } }
> ```
> 错误统一：
> ```json
> { "error": { "code": "INVALID_BODY", "message": "...", "details": { ... } } }
> ```

## 目录

1. [Auth & Users](#auth--users)
2. [权限申请](#权限申请-rolea pplications)
3. [组织](#组织-organizations)
4. [待办](#待办-pending-tasks)
5. [活动立项申请](#活动立项申请-activity-applications)
6. [立项审核](#立项审核-approval)
7. [活动](#活动-activities)
8. [招募](#招募-recruitments)
9. [报名](#报名-signups)
10. [签到](#签到-checkin)
11. [结项](#结项-closure-applications)
12. [公告](#公告-announcements)
13. [通知](#通知-notifications)
14. [管理后台 & 日志](#管理后台--日志-admin)

---

## Auth & Users

> 这部分已经联调通过，列出供参考。

| 方法 | 路径 | 说明 |
| ---- | ---- | ---- |
| POST | `/auth/register` | 注册 `{ username, password, userType, realName?, phone?, email? }` → `LoginResult` |
| POST | `/auth/login`    | 登录 `{ username, password }` → `LoginResult` |
| GET  | `/users/me`      | 查询当前用户（含 studentProfile / teacherProfile / roles） |
| PATCH | `/users/me`     | 更新基础字段：`realName / phone / email` |
| PATCH | `/users/me/profile` | 更新学生 / 教师扩展字段 |
| GET  | `/users/me/roles`   | 当前用户角色（一般已包含在 `/users/me`） |

---

## 权限申请 role-applications

### `POST /role-applications`

Body：
```json
{
  "appliedRole": "ORGANIZER | REVIEWER | SYS_ADMIN",
  "organizationId": "org-id (REVIEWER/ORGANIZER 必填)",
  "reason": "申请理由 (≥10 字)"
}
```
Response: `RoleApplicationDto`

错误码：
- `INVALID_BODY`：缺字段、reason 太短
- `FORBIDDEN`：例如学生申请 REVIEWER

### `GET /role-applications/me`

Response: `RoleApplicationDto[]`

### `GET /role-applications/:id`

Response: `RoleApplicationDto`（仅本人或 SYS_ADMIN 可访问）

### `GET /admin/role-applications?status=&page=&pageSize=`

Response: `Paginated<RoleApplicationDto>`

### `POST /role-applications/:id/review`

Body：
```json
{ "decision": "APPROVE | REJECT", "comment": "可选意见" }
```
Response: `RoleApplicationDto`（已包含审核结果）

副作用：审核通过时
- 写入 `user_roles`
- ORGANIZER / REVIEWER 同时写入 `user_organizations`
- 关闭 `pending_tasks`
- 调用 `notifyUser(applicantId, ...)`

---

## 组织 organizations

### `GET /organizations?type=&status=`
Response: `OrganizationDto[]`

### `GET /organizations/tree`
Response: `OrganizationNode[]`（递归 children）

### `GET /organizations/:id`
Response: `OrganizationDto`

### `POST /admin/organizations`
Body：`CreateOrganizationBody`
Response: `OrganizationDto`

### `PATCH /admin/organizations/:id`
Body：`UpdateOrganizationBody`（可只传 status 用于停用）

### `POST /admin/users/:id/organizations`
Body：`{ organizationId, role?: "ORGANIZER|REVIEWER|MEMBER" }`
Response: `UserOrganizationDto`

### `DELETE /admin/users/:id/organizations/:organizationId`
Response: 204

### `GET /admin/users/:id/organizations`
Response: `UserOrganizationDto[]`

---

## 待办 pending-tasks

### `GET /pending-tasks/me?status=PENDING|PROCESSED|CANCELLED`
Response: `PendingTaskDto[]`

### `GET /pending-tasks/:id`
Response: `PendingTaskDto`

### `PATCH /pending-tasks/:id/process`
Response: `PendingTaskDto`（status → PROCESSED，processedAt 写入）

> 一般由业务流程内部 `markTaskProcessed(...)` 触发，本接口仅给管理员或调试使用。

---

## 活动立项申请 activity-applications

### `POST /activity-applications`
Body：`UpsertActivityApplicationBody`
Response: `ActivityApplicationDto`（status=DRAFT）

### `GET /activity-applications/me?status=&page=&pageSize=`
Response: `Paginated<ActivityApplicationDto>`

### `GET /activity-applications/:id`
Response: `ActivityApplicationDto`

### `PATCH /activity-applications/:id`
Body：`Partial<UpsertActivityApplicationBody>`（仅 DRAFT / NEED_MORE 可改）

### `POST /activity-applications/:id/attachments`
multipart/form-data: `file`
Response: `ApplicationAttachmentDto`

### `DELETE /activity-applications/:id/attachments/:attachmentId`
Response: 204

### `POST /activity-applications/:id/submit`
Response: `ActivityApplicationDto`（DRAFT → SUBMITTED → APPROVING；并创建第一级 pending_task）

错误：
- `TRANSITION_NOT_ALLOWED`：当前状态非 DRAFT / NEED_MORE
- `INVALID_BODY`：必填字段缺失

---

## 立项审核 approval

### `GET /approval/activity-applications/:id`
Response: `ActivityApplicationDto`（含 attachments）

### `POST /approval/activity-applications/:id/review`
Body：
```json
{ "decision": "APPROVE | REJECT | NEED_MORE", "comment": "可选意见" }
```
Response: `ActivityApplicationDto`（包含最新状态与 currentApprovalLevel）

副作用：
- 写入 `approval_records`
- 关闭当前 `pending_tasks`
- 决定下一步：
  - `APPROVE` 且为最后一级 → 生成 `activities`，状态 APPROVED
  - `APPROVE` 非最后一级 → 创建下一级 `pending_tasks`，状态保持 APPROVING
  - `NEED_MORE` → 状态 NEED_MORE，回到申请者
  - `REJECT` → 状态 REJECTED

### `GET /activity-applications/:id/approval-records`
Response: `ApprovalRecordDto[]`

---

## 活动 activities

### `GET /activities?status=&keyword=&page=&pageSize=`
Response: `Paginated<ActivityDto>`

### `GET /activities/me`
Response: `Paginated<ActivityDto>`（仅 organizerId = 当前用户）

### `GET /activities/:id`
Response: `ActivityDto`

### `POST /activities/:id/start`
Response: `ActivityDto`（status → ONGOING）

### `POST /activities/:id/finish`
Response: `ActivityDto`（status → FINISHED）

> **不要**对外暴露 `PATCH /activities/:id/status`。

---

## 招募 recruitments

### `POST /recruitments`
Body：`UpsertRecruitmentBody`
Response: `RecruitmentDto`（DRAFT）

### `GET /recruitments?status=&page=`
Response: `Paginated<RecruitmentDto>`

### `GET /recruitments/:id`
Response: `RecruitmentDto`

### `PATCH /recruitments/:id`
Body：`Partial<UpsertRecruitmentBody>`（仅 DRAFT）

### `POST /recruitments/:id/publish`
Response: `RecruitmentDto`（DRAFT → PUBLISHED）；同时更新 `activities.status` 为 RECRUITING（若当前为 PLANNED）。

### `POST /recruitments/:id/close`
Response: `RecruitmentDto`（→ CLOSED）

---

## 报名 signups

### `POST /recruitments/:id/signups`
Body：`{ "remark"?: "..." }`
Response: `SignupDto`（status=SUBMITTED）

校验链（任何一条失败返回 `INVALID_BODY` 或 `CONFLICT`，message 中清楚说明）：
1. 招募状态必须是 PUBLISHED
2. 当前时间必须在 `registrationStart` 与 `registrationEnd` 之间
3. 用户类型 ∈ `allowedUserTypes`
4. 若学生，`student_profiles.grade` ∈ `allowedGrades`（`allowedGrades` 为空表示不限）
5. 若学生，`student_profiles.major` ∈ `allowedMajors`（空表示不限）
6. 未重复报名同一个 recruitment
7. 若 `requiresAttachment` = true，要求随后上传附件

### `GET /signups/me?page=`
Response: `Paginated<SignupDto>`

### `POST /signups/:id/cancel`
Response: `SignupDto`（→ CANCELED）

### `GET /recruitments/:id/signups?status=&page=`
Response: `Paginated<SignupDto>`（仅 ORGANIZER 或 SYS_ADMIN）

### `GET /signups/:id`
Response: `SignupDto`

### `POST /signups/:id/review`
Body：`{ "decision": "APPROVE|REJECT", "comment": "可选" }`
Response: `SignupDto`

### `POST /signups/:id/attachments`
multipart/form-data: `file`
Response: `SignupAttachmentDto`

---

## 签到 checkin

### `POST /checkin-sessions`
Body：`CreateCheckinSessionBody`
Response: `CheckinSessionDto`（DRAFT；method=CODE 时由后端生成 6 位 code）

### `GET /activities/:id/checkin-sessions`
Response: `CheckinSessionDto[]`

### `POST /checkin-sessions/:id/open`
Response: `CheckinSessionDto`（DRAFT → OPEN；触发已通过报名者的"签到提醒"通知）

### `POST /checkin-sessions/:id/close`
Response: `CheckinSessionDto`（→ CLOSED）

### `POST /checkin-sessions/:id/checkin`
Body：`{ "code": "签到码（method=CODE 时必传）" }`
Response: `CheckinRecordDto`（写入 checked_in 或 late）

校验：
- 当前用户必须是该活动的 APPROVED signup
- 当前时间在 session.start/end 内（晚于 start 的标 LATE）
- 不重复签到（已签到时返回 CONFLICT）

### `GET /checkin-sessions/:id/records`
Response: `CheckinRecordDto[]`

### `POST /checkin-sessions/:id/manual-records`
Body：`{ "userId": "...", "status"?: "CHECKED_IN|LATE" }`
Response: `CheckinRecordDto`（手动补签，仅 ORGANIZER）

---

## 结项 closure-applications

### `POST /closure-applications`
Body：`UpsertClosureApplicationBody`
Response: `ClosureApplicationDto`（DRAFT）

### `GET /closure-applications/me?status=&page=`
Response: `Paginated<ClosureApplicationDto>`

### `GET /closure-applications/:id`
Response: `ClosureApplicationDto`

### `PATCH /closure-applications/:id`
Body：`Partial<UpsertClosureApplicationBody>`（仅 DRAFT / NEED_MORE）

### `POST /closure-applications/:id/attachments`
multipart/form-data: `file`
Response: `ApplicationAttachmentDto`

### `POST /closure-applications/:id/submit`
Response: `ClosureApplicationDto`（→ SUBMITTED → APPROVING）

### `POST /closure-applications/:id/review`
Body：`{ "decision": "APPROVE|REJECT|NEED_MORE", "comment": "..." }`
Response: `ClosureApplicationDto`

副作用：与立项审核一致。终审通过时把 `activities.status` 置为 `CLOSED`。

### `GET /closure-applications/:id/review-records`
Response: `ApprovalRecordDto[]`

---

## 公告 announcements

### `GET /announcements?category=&pinned=&page=`
Response: `Paginated<AnnouncementDto>`（公开接口；前端首页/公告页都会调用）

### `GET /announcements/:id`
Response: `AnnouncementDto`

### `POST /announcements`（ORGANIZER 或 SYS_ADMIN）
Body：`UpsertAnnouncementBody`
Response: `AnnouncementDto`（DRAFT）

### `PATCH /announcements/:id`
Body：`Partial<UpsertAnnouncementBody>`

### `POST /announcements/:id/publish`
Response: `AnnouncementDto`（→ PUBLISHED）

### `POST /announcements/:id/archive`
Response: `AnnouncementDto`（→ ARCHIVED）

---

## 通知 notifications

### `GET /notifications?read=&page=`
Response: `Paginated<NotificationDto>`

### `GET /notifications/unread-count`
Response: `{ "count": 3 }`

### `PATCH /notifications/:id/read`
Response: `NotificationDto`

### `PATCH /notifications/read-all`
Response: 204

> 通知本身不开放写入接口，由各业务模块内部 service 触发。

---

## 管理后台 & 日志 admin

### `GET /admin/users?keyword=&role=&status=&page=`
Response: `Paginated<AdminUserDto>`

### `GET /admin/users/:id`
Response: `AdminUserDto`

### `PATCH /admin/users/:id/status`
Body：`{ "status": "ACTIVE | DISABLED", "reason"?: "..." }`
Response: `AdminUserDto`

### `GET /admin/system-logs?action=&actorId=&resourceType=&resourceId=&from=&to=&page=`
Response: `Paginated<SystemLogDto>`

### `GET /admin/dashboard`
Response: `DashboardSummaryDto`

---

## 附录 A：状态机

参考 `子模块开发顺序.docx` 表 11；前端的状态机断言基于此：

```
draft
  ↓ 提交
submitted → approving
                ↓ need_more  →  ↑ 再次提交
                ↓ reject     →  rejected
                ↓ final approve → approved (生成 activities)
```

`activities`：

```
PLANNED  →(publish 招募)→  RECRUITING  →(/start)→  ONGOING  →(/finish)→  FINISHED  →(结项通过)→  CLOSED
```

## 附录 B：错误码约定

| code | HTTP | 说明 |
| --- | --- | --- |
| `UNAUTHORIZED` | 401 | 未登录或 token 失效 |
| `FORBIDDEN` | 403 | 角色不足 |
| `NOT_FOUND` | 404 | 资源不存在 |
| `INVALID_BODY` | 400 | 请求体校验失败 |
| `CONFLICT` | 409 | 唯一性冲突 / 重复操作（如重复报名） |
| `TRANSITION_NOT_ALLOWED` | 409 | 状态机不允许此动作 |
| `INTERNAL_ERROR` | 500 | 兜底 |
