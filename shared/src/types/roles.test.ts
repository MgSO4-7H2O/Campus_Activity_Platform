import { describe, expect, it } from 'vitest'

import { UserRole } from './roles.js'

describe('UserRole', () => {
  it('defines the core role codes seeded by the backend', () => {
    expect(Object.values(UserRole)).toEqual([
      'BASIC_USER',
      'ORGANIZER',
      'REVIEWER',
      'SYS_ADMIN',
    ])
  })
})
