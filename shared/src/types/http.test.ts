import { describe, expect, it } from 'vitest'

import type { ApiFailure, ApiSuccess } from './http.js'

describe('API response contracts', () => {
  it('supports successful responses with optional metadata', () => {
    const response: ApiSuccess<{ id: string }> = {
      data: { id: 'resource-id' },
      meta: { page: 1, pageSize: 20, total: 1 },
    }

    expect(response.data.id).toBe('resource-id')
    expect(response.meta).toEqual({ page: 1, pageSize: 20, total: 1 })
  })

  it('supports failure responses with actionable error fields', () => {
    const response: ApiFailure = {
      error: {
        code: 'INVALID_BODY',
        message: '请求参数校验失败',
        details: { field: 'username' },
      },
    }

    expect(response.error.code).toBe('INVALID_BODY')
    expect(response.error.message).toBe('请求参数校验失败')
    expect(response.error.details).toEqual({ field: 'username' })
  })
})
