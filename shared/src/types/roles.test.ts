import { describe, expect, it } from 'vitest'

import { UserRole } from './roles.js'

describe('UserRole', () => {
  it('contains STUDENT role', () => {
    expect(UserRole.STUDENT).toBe('STUDENT')
  })
})

