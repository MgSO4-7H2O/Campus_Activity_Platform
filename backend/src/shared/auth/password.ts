import crypto from 'node:crypto'

function base64UrlEncode(buf: Buffer) {
  return buf
    .toString('base64')
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replaceAll('=', '')
}

function base64UrlDecode(input: string) {
  const normalized = input.replaceAll('-', '+').replaceAll('_', '/')
  const padLen = (4 - (normalized.length % 4)) % 4
  const padded = normalized + '='.repeat(padLen)
  return Buffer.from(padded, 'base64')
}

export async function hashPassword(password: string) {
  const salt = crypto.randomBytes(16)
  const keyLen = 32
  const derived = await new Promise<Buffer>((resolve, reject) => {
    crypto.scrypt(password, salt, keyLen, (err, dk) => {
      if (err) reject(err)
      else resolve(dk as Buffer)
    })
  })

  return `scrypt$${base64UrlEncode(salt)}$${base64UrlEncode(derived)}`
}

export async function verifyPassword(password: string, passwordHash: string) {
  const [algo, saltB64, derivedB64] = passwordHash.split('$')
  if (algo !== 'scrypt' || !saltB64 || !derivedB64) return false

  const salt = base64UrlDecode(saltB64)
  const expected = base64UrlDecode(derivedB64)
  const derived = await new Promise<Buffer>((resolve, reject) => {
    crypto.scrypt(password, salt, expected.length, (err, dk) => {
      if (err) reject(err)
      else resolve(dk as Buffer)
    })
  })

  if (derived.length !== expected.length) return false
  return crypto.timingSafeEqual(derived, expected)
}

