# API 设计约定（骨架版）

## 1. REST 约定

- 统一前缀：`/api/v1`
- 资源命名：复数名词（如 `/activity-applications`）
- 版本升级：通过 `/api/v2` 等方式演进

## 2. 鉴权与权限

- Header：`Authorization: Bearer <token>`
- 角色：STUDENT / ORGANIZER / REVIEWER_L1 / REVIEWER_L2 / SYS_ADMIN（可在 shared 统一枚举）
- 鉴权失败：`401`
- 权限不足：`403`

## 3. 响应格式（建议）

### 3.1 成功

```json
{ "data": {}, "meta": {} }
```

### 3.2 失败

```json
{ "error": { "code": "VALIDATION_ERROR", "message": "..." , "details": [] } }
```

## 4. Swagger/OpenAPI

- 后端提供：`/api-docs`（Swagger UI）
- JSON：`/api-docs.json`
- 由路由与 schema 注释/定义生成（后续逐步补全）

