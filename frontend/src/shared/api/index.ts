/**
 * API 客户端聚合导出。
 *
 * 用法：
 *   import { listMyPendingTasks, getOrganizationTree } from '@/shared/api'
 *
 * 各模块独立文件位于本目录内（按 docx 中的 14 个子模块对应组织）。
 * 真实联调时只需在后端实现 docs/api-contract.md 中的接口即可，本层调用方式保持不变。
 */

export * from './activities'
export * from './activity-applications'
export * from './admin'
export * from './announcements'
export * from './auth'
export * from './checkin'
export * from './closures'
export * as dto from './dto'
export type * from './dto'
export * from './notifications'
export * from './organizations'
export * from './pending-tasks'
export * from './recruitments'
export * from './role-applications'
export * from './signups'
export * from './users'

export { apiClient } from './client'
export { getApiErrorMessage } from './error'
