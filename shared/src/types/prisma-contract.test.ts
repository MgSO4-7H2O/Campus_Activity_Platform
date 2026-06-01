import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

import { ActivityApplicationStatus, SignupStatus } from './statuses.js'

function readPrismaSchema(): string {
  const dirname = path.dirname(fileURLToPath(import.meta.url))
  const schemaPath = path.resolve(dirname, '../../../backend/prisma/schema.prisma')
  return fs.readFileSync(schemaPath, 'utf8')
}

function getPrismaEnumValues(schema: string, enumName: string): string[] {
  const enumPattern = new RegExp(`enum\\s+${enumName}\\s+{([\\s\\S]*?)}`)
  const match = enumPattern.exec(schema)
  if (!match) {
    throw new Error(`Prisma enum ${enumName} was not found`)
  }

  return match[1]
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('//') && !line.startsWith('@@'))
    .map((line) => line.split(/\s+/)[0])
}

describe('shared constants stay aligned with Prisma-backed API contract', () => {
  const schema = readPrismaSchema()

  it('keeps activity application statuses in sync with Prisma enum names', () => {
    expect(Object.values(ActivityApplicationStatus)).toEqual(
      getPrismaEnumValues(schema, 'ActivityApplicationStatus')
    )
  })

  it('maps Prisma signup statuses to the public API status names', () => {
    const publicSignupStatuses = getPrismaEnumValues(schema, 'SignupStatus').map((status) => {
      if (status === 'PENDING') return 'SUBMITTED'
      if (status === 'CANCELLED') return 'CANCELED'
      return status
    })

    expect(Object.values(SignupStatus)).toEqual(publicSignupStatuses)
  })
})
