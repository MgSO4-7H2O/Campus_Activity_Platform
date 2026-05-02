import crypto from 'node:crypto'

export type JwtPayload = {
  sub: string
  iat: number
  exp: number
} & Record<string, unknown>

export type SignJwtPayload = {
  sub: string
} & Record<string, unknown> &
  Partial<Pick<JwtPayload, 'iat' | 'exp'>>

function base64UrlEncode(buf: Buffer) {
  return buf
    .toString('base64')
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replaceAll('=', '')
}

function base64UrlDecodeToBuffer(input: string) {
  const normalized = input.replaceAll('-', '+').replaceAll('_', '/')
  const padLen = (4 - (normalized.length % 4)) % 4
  const padded = normalized + '='.repeat(padLen)
  return Buffer.from(padded, 'base64')
}

function signHmacSha256(data: string, secret: string) {
  return crypto.createHmac('sha256', secret).update(data).digest()
}

/**
 * 签发 JWT。
 * 当前系统使用 sub 保存登录用户 ID。
 */
export function signJwt(payload: SignJwtPayload, secret: string, ttlSeconds: number) {
  const header = { alg: 'HS256', typ: 'JWT' }
  const now = Math.floor(Date.now() / 1000)

  const { iat, exp, ...customPayload } = payload

  const fullPayload: JwtPayload = {
    ...customPayload,
    sub: payload.sub,
    iat: iat ?? now,
    exp: exp ?? now + ttlSeconds,
  }

  const encodedHeader = base64UrlEncode(Buffer.from(JSON.stringify(header)))
  const encodedPayload = base64UrlEncode(Buffer.from(JSON.stringify(fullPayload)))
  const signingInput = `${encodedHeader}.${encodedPayload}`
  const signature = base64UrlEncode(signHmacSha256(signingInput, secret))

  return `${signingInput}.${signature}`
}

/**
 * 校验 JWT，并返回已验证的载荷。
 */
export function verifyJwt(token: string, secret: string): JwtPayload {
  const parts = token.split('.')
  if (parts.length !== 3) {
    throw new Error('Invalid token')
  }

  const [encodedHeader, encodedPayload, encodedSignature] = parts
  if (!encodedHeader || !encodedPayload || !encodedSignature) {
    throw new Error('Invalid token')
  }

  const signingInput = `${encodedHeader}.${encodedPayload}`
  const expectedSignature = signHmacSha256(signingInput, secret)
  const actualSignature = base64UrlDecodeToBuffer(encodedSignature)

  if (actualSignature.length !== expectedSignature.length) {
    throw new Error('Invalid token')
  }

  if (!crypto.timingSafeEqual(actualSignature, expectedSignature)) {
    throw new Error('Invalid token')
  }

  let parsedPayload: unknown

  try {
    const payloadJson = base64UrlDecodeToBuffer(encodedPayload).toString('utf8')
    parsedPayload = JSON.parse(payloadJson)
  } catch {
    throw new Error('Invalid token')
  }

  if (typeof parsedPayload !== 'object' || parsedPayload === null) {
    throw new Error('Invalid token')
  }

  const payload = parsedPayload as Record<string, unknown>

  if (typeof payload.sub !== 'string' || !payload.sub) {
    throw new Error('Invalid token')
  }

  if (typeof payload.iat !== 'number') {
    throw new Error('Invalid token')
  }

  if (typeof payload.exp !== 'number') {
    throw new Error('Invalid token')
  }

  const now = Math.floor(Date.now() / 1000)
  if (now >= payload.exp) {
    throw new Error('Token expired')
  }

  return {
    ...payload,
    sub: payload.sub,
    iat: payload.iat,
    exp: payload.exp,
  }
}