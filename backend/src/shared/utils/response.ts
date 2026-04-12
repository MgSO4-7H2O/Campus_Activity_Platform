import type { ApiFailure, ApiSuccess } from '@campus-activity/shared'

export function ok<T>(data: T, meta?: Record<string, unknown>): ApiSuccess<T> {
  return meta ? { data, meta } : { data }
}

export function fail(code: string, message: string, details?: unknown): ApiFailure {
  return details ? { error: { code, message, details } } : { error: { code, message } }
}

