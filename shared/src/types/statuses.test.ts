import { describe, expect, it } from 'vitest'

import { ActivityApplicationStatus, SignupStatus } from './statuses.js'

describe('shared status constants', () => {
  it('defines the activity application workflow statuses used by the API contract', () => {
    expect(Object.values(ActivityApplicationStatus)).toEqual([
      'DRAFT',
      'SUBMITTED',
      'APPROVING',
      'NEED_MORE',
      'REJECTED',
      'APPROVED',
      'ARCHIVED',
    ])
  })

  it('defines signup statuses used by registration flows', () => {
    expect(Object.values(SignupStatus)).toEqual([
      'SUBMITTED',
      'APPROVED',
      'REJECTED',
      'CANCELED',
    ])
  })
})
