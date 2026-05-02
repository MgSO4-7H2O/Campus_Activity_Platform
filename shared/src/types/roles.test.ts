import { describe, expect, it } from 'vitest'

import { UserRole } from './roles.js'

describe('UserRole', () => {
  it('contains STUDENT role', () => {
    expect(UserRole.STUDENT).toBe('STUDENT')
  })

  it('contains BASIC_USER role', () => {
    expect(UserRole.BASIC_USER).toBe('BASIC_USER')
  })
})
