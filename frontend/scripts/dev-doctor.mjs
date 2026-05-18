#!/usr/bin/env node
/**
 * 前端联调环境体检脚本。
 *
 * 检查项：
 * - 前端 dev server 是否在线（VITE_DEV_URL 或默认 5173）
 * - 后端 health 接口是否可达（VITE_API_URL）
 * - 后端是否有 seed 账号 student1 / organizer1 / reviewer1 / admin
 * - .env / .env.example 是否存在
 *
 * 用法：
 *   node scripts/dev-doctor.mjs
 *   node scripts/dev-doctor.mjs --api http://localhost:3001/api/v1
 */

import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const FRONTEND_ROOT = path.resolve(HERE, '..')

function parseArgs(argv) {
  const args = { api: null, app: null }
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--api') args.api = argv[++i]
    else if (argv[i] === '--app') args.app = argv[++i]
  }
  return args
}

const args = parseArgs(process.argv.slice(2))

function readDotEnv(file) {
  if (!existsSync(file)) return {}
  const result = {}
  for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i)
    if (m) result[m[1]] = m[2].replace(/^['"]|['"]$/g, '')
  }
  return result
}

const env = readDotEnv(path.join(FRONTEND_ROOT, '.env'))
const API = args.api ?? env.VITE_API_URL ?? 'http://localhost:3000/api/v1'
const APP = args.app ?? 'http://localhost:5173'

const failures = []

function pass(msg) {
  console.log('  ✓', msg)
}

function fail(msg, hint) {
  console.log('  ✗', msg)
  if (hint) console.log('     →', hint)
  failures.push(msg)
}

async function check(name, fn) {
  console.log(`\n[${name}]`)
  try {
    await fn()
  } catch (err) {
    fail(`检查失败: ${name}`, String(err).slice(0, 200))
  }
}

async function ping(url, timeoutMs = 3000) {
  const ac = new AbortController()
  const t = setTimeout(() => ac.abort(), timeoutMs)
  try {
    const res = await fetch(url, { signal: ac.signal })
    clearTimeout(t)
    return res
  } catch (err) {
    clearTimeout(t)
    throw err
  }
}

await check('环境变量', async () => {
  if (!existsSync(path.join(FRONTEND_ROOT, '.env'))) {
    fail('.env 不存在', '执行 cp .env.example .env 后修改 VITE_API_URL')
  } else {
    pass('.env 存在')
  }
  pass(`VITE_API_URL = ${API}`)
  pass(`Front-end URL = ${APP}`)
})

await check('前端 dev server', async () => {
  try {
    const res = await ping(APP)
    if (res.ok || res.status < 500) pass(`${APP} 可访问 (HTTP ${res.status})`)
    else fail(`${APP} 返回 ${res.status}`, '请确认 pnpm dev 是否正常启动')
  } catch {
    fail(`无法连接 ${APP}`, '请先运行 pnpm --filter @campus-activity/web dev')
  }
})

await check('后端 health', async () => {
  const healthUrl = API.replace(/\/$/, '') + '/health'
  try {
    const res = await ping(healthUrl)
    if (res.ok) pass(`${healthUrl} 200`)
    else fail(`${healthUrl} 返回 ${res.status}`, '请确认后端是否启动')
  } catch {
    fail(
      `无法连接 ${healthUrl}`,
      '请先运行 pnpm --filter @campus-activity/server dev'
    )
  }
})

await check('后端 seed 账号', async () => {
  const users = ['student1', 'organizer1', 'reviewer1', 'admin']
  for (const u of users) {
    try {
      const res = await fetch(`${API.replace(/\/$/, '')}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: u, password: 'Password123!' }),
      })
      if (res.ok) pass(`登录成功: ${u}`)
      else fail(`登录失败: ${u}`, '执行 pnpm --filter @campus-activity/server db:seed')
    } catch (err) {
      fail(`登录请求异常: ${u}`, String(err).slice(0, 100))
    }
  }
})

console.log('\n===========================')
if (failures.length === 0) {
  console.log('✅ 所有检查通过，前后端联调环境就绪。')
  process.exit(0)
} else {
  console.log(`❌ 发现 ${failures.length} 项问题，请按上文提示修复。`)
  process.exit(2)
}
