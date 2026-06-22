# 前端页面：Mock 原型 → 真实 API 接入指南

本文记录把前端页面从 **mock 数据原型** 切换到 **真实后端 API** 的标准操作，并以「签到」「立项审核」两个模块为已完成示例。其余仍处于 mock 原型阶段的页面，可按本文的相同步骤迁移。

## 背景

前端在原型阶段大量页面直接从 `src/shared/mock/data.ts` 读取写死数据来展示样式，并未调用后端。底层能力其实已就绪：

- 统一 axios 客户端：`src/shared/api/client.ts`（自动注入 Bearer Token、统一处理 401）。
- 各业务模块的 API 封装：`src/shared/api/*.ts`，通过 `src/shared/api/index.ts` 聚合导出。
- 前后端共享的数据契约：`src/shared/api/dto.ts`（与 `docs/api-contract.md` 对应）。
- 后端对应路由：`backend/src/modules/*/*.routes.ts`。

迁移工作就是把页面里的 mock 读取换成真实 API 调用，并补齐加载/错误/空态。

## 数据获取约定

项目沿用 **`useState` + `useEffect` + `.then/.catch`** 的取数模式（参考 `src/modules/tasks/TasksPage.tsx`、`src/modules/users/MeProfilePage.tsx`）。虽然依赖里装了 React Query，但目前页面层并未使用，迁移时**保持与现有页面一致**，不要单独引入 `useQuery` 以免割裂风格。

标准结构：

```tsx
const [loading, setLoading] = useState(true)
const [data, setData] = useState<Dto[]>([])

const load = useCallback(async () => {
  setLoading(true)
  try {
    setData(await someApi(params))
  } catch (err) {
    message.error(getApiErrorMessage(err, '加载失败'))
  } finally {
    setLoading(false)
  }
}, [params])

useEffect(() => { void load() }, [load])
```

要点：

- 错误用 `getApiErrorMessage(err, fallback)`（`src/shared/api/error.ts`），**必须传第二个 fallback 文案**。
- 写操作（创建/审核/开关）成功后用 `message.success` 提示，并重新 `load()` 刷新。
- 列表/表格补 `loading` 与空态（`Empty`）。
- 注意 DTO 枚举为**大写**（如签到方式 `CODE/QRCODE/MANUAL`、审核状态 `APPROVING/APPROVED/...`），不要沿用 mock 里的小写值。

## 测试约定

页面接入真实 API 后，原先针对 mock 内容写死断言的测试会失效。对应测试需改为 **mock api 模块**（参考 `MeProfilePage.test.tsx`）：

```tsx
vi.mock('antd', async () => {
  const actual = await vi.importActual<typeof import('antd')>('antd')
  return { ...actual, message: { success: vi.fn(), error: vi.fn(), warning: vi.fn() } }
})
vi.mock('../../shared/api/xxx', () => ({ someApi: vi.fn() }))

const mocked = vi.mocked(someApi)
beforeEach(() => { mocked.mockReset() })
// mocked.mockResolvedValue(...) 后用 findBy* 等待异步渲染
```

异步加载的页面断言用 `findBy*` / `waitFor`，不要用同步 `getBy*`。

## 迁移步骤

1. 读后端 `*.routes.ts` + `src/shared/api/<模块>.ts` + `dto.ts`，确认接口、入参、字段形状。
2. 用真实 API 替换 mock 读取，按上面的取数约定补 loading/错误/空态。
3. 删掉对 `shared/mock/data` 的 import（除非确为有意保留的 fallback）。
4. 同步重写对应 `*.test.tsx`，改成 mock api 模块。
5. 校验：`npm run typecheck` → `npx vitest run <改动文件>` → `npx eslint <改动文件>`，最后跑一次全量 `npm run test:run`。

## 已完成示例

### 1. 签到 `src/modules/checkin/CheckinPage.tsx`

接入 `src/shared/api/checkin.ts`：

| 能力 | API |
| --- | --- |
| 加载活动下签到场次 | `listCheckinSessions(activityId)` |
| 创建签到场次（CODE/QRCODE/MANUAL） | `createCheckinSession(body)` |
| 开启 / 关闭签到 | `openCheckinSession(id)` / `closeCheckinSession(id)` |
| 加载签到记录 | `listCheckinRecords(id)` |
| 组织者手动补签 | `manualCheckin(id, { userId })` |
| 活动标题展示 | `getActivity(activityId)` |

要点：创建不再前端生成签到码（由后端生成，回显在场次面板）；`startAt/endAt` 以 ISO 字符串提交；签到记录、场次状态（DRAFT/OPEN/CLOSED）全部来自后端。

### 2. 立项审核

- 待办列表 `src/modules/approval/ReviewerInboxPage.tsx`：审核侧没有独立"收件箱"接口，改为读 `listMyPendingTasks({ status: 'PENDING' })` 并筛 `relatedResourceType === 'ACTIVITY_APPLICATION'`，跳转用待办的 `relatedResourceId`。
- 审核详情 `src/modules/approval/ReviewerDetailPage.tsx`：
  - 申请详情 `getReviewerApplication(id)`
  - 审核历史 `listApprovalRecords(id)`
  - 提交决定 `reviewActivityApplication(id, { decision, comment })`，`decision ∈ APPROVE | REJECT | NEED_MORE`
  - 申请状态标签因 DTO 为大写枚举，页面内置 `AppStatusTag` 映射，未复用只认小写的 `ApplicationStatusTag`。

### 验证结果

- `npm run typecheck`：通过
- `npm run test:run`：20 文件 / 49 测试全部通过
- `npx eslint`（改动文件）：无告警

## 待迁移页面（仍为 mock 原型，可按本文操作）

活动列表/详情/我的活动、我的立项申请、通知中心、结项申请、招募报名相关页、权限申请、公告管理等。后端接口已在 `src/shared/api/` 中封装齐全，按「迁移步骤」逐页替换即可。
