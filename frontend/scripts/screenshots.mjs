#!/usr/bin/env node
/**
 * 自动化页面截图脚本（基于 Playwright Chromium）。
 *
 * 改进点：
 * - 后端未就绪时自动只跑公开/匿名路由，不会因登录失败崩溃。
 * - 自定义 Chromium 路径可通过 PLAYWRIGHT_CHROMIUM_PATH 覆盖。
 * - 支持 CLI 过滤：--filter <regex> 仅运行匹配的截图。
 * - 失败的截图不会让整个脚本退出，最终打印汇总。
 * - 自动创建输出目录，输出根目录可通过 --out <dir> 覆盖。
 *
 * 用法：
 *   node scripts/screenshots.mjs                       # 全量
 *   node scripts/screenshots.mjs --filter "01|02"      # 只跑匹配项
 *   node scripts/screenshots.mjs --no-auth             # 只跑公开页面
 *   node scripts/screenshots.mjs --api http://...      # 覆盖后端地址
 *   node scripts/screenshots.mjs --app http://...      # 覆盖前端地址
 */

import { chromium } from '@playwright/test'
import { existsSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

// ---------- 参数解析 ----------

function parseArgs(argv) {
  const args = {
    filter: null,
    out: null,
    api: null,
    app: null,
    noAuth: false,
    headless: true,
  }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--filter') args.filter = new RegExp(argv[++i])
    else if (a === '--out') args.out = argv[++i]
    else if (a === '--api') args.api = argv[++i]
    else if (a === '--app') args.app = argv[++i]
    else if (a === '--no-auth') args.noAuth = true
    else if (a === '--headed') args.headless = false
    else if (a === '--help' || a === '-h') {
      console.log(`Usage: node scripts/screenshots.mjs [options]
  --filter <regex>   只跑匹配文件名/路由的截图
  --out <dir>        输出目录（默认 docs/screenshots）
  --api <url>        后端 baseURL（默认 http://localhost:3000/api/v1）
  --app <url>        前端 baseURL（默认 http://localhost:5173）
  --no-auth          跳过登录，只跑公开页面
  --headed           以有头模式启动浏览器（调试用）`)
      process.exit(0)
    }
  }
  return args
}

const args = parseArgs(process.argv.slice(2))

const API = args.api ?? process.env.VITE_API_URL ?? 'http://localhost:3000/api/v1'
const APP = args.app ?? process.env.SCREENSHOT_APP_URL ?? 'http://localhost:5173'
const HERE = path.dirname(fileURLToPath(import.meta.url))
const OUT_DIR = args.out ?? path.resolve(HERE, '..', 'docs', 'screenshots')

if (!existsSync(OUT_DIR)) {
  mkdirSync(OUT_DIR, { recursive: true })
  console.log('[init] created', OUT_DIR)
}

// ---------- 后端登录辅助 ----------

async function login(username) {
  try {
    const res = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password: 'Password123!' }),
    })
    if (!res.ok) return null
    const json = await res.json()
    return json.data ?? null
  } catch (err) {
    console.warn('[login skip]', username, String(err).slice(0, 100))
    return null
  }
}

async function setSession(page, session) {
  if (!session) {
    await page.evaluate(() => localStorage.removeItem('cap-auth'))
    return
  }
  const order = ['SYS_ADMIN', 'REVIEWER', 'ORGANIZER', 'BASIC_USER']
  const viewRole =
    order.find((r) => session.user.roles.includes(r)) ?? session.user.roles[0]
  const persist = {
    state: {
      accessToken: session.accessToken,
      user: session.user,
      viewRole,
    },
    version: 0,
  }
  await page.evaluate(
    (data) => localStorage.setItem('cap-auth', JSON.stringify(data)),
    persist
  )
}

// ---------- 截图驱动 ----------

const results = []

async function shot(page, route, file) {
  const label = `${file} (${route})`
  if (args.filter && !args.filter.test(file) && !args.filter.test(route)) {
    results.push({ file, route, status: 'skip' })
    return
  }
  try {
    await page.goto(APP + route, { waitUntil: 'networkidle', timeout: 15000 })
  } catch (err) {
    results.push({ file, route, status: 'nav-fail', error: String(err).slice(0, 120) })
    console.warn('[nav fail]', label)
    return
  }
  await page.waitForTimeout(700)
  try {
    await page.screenshot({ path: path.join(OUT_DIR, file), fullPage: false })
    results.push({ file, route, status: 'ok' })
    console.log('[ok]', label)
  } catch (err) {
    results.push({ file, route, status: 'shot-fail', error: String(err).slice(0, 120) })
    console.warn('[shot fail]', label, String(err).slice(0, 120))
  }
}

// ---------- 路由清单 ----------

const PUBLIC_ROUTES = [
  ['/', '01-home-anonymous.png'],
  ['/login', '02-login.png'],
  ['/register', '03-register.png'],
  ['/activities', '04-activities-anonymous.png'],
  ['/organizations', '05-organizations-anonymous.png'],
]

const STUDENT_ROUTES = [
  ['/', '10-home-student.png'],
  ['/tasks', '11-tasks-student.png'],
  ['/notifications', '12-notifications.png'],
  ['/permissions/apply', '13-permission-apply.png'],
  ['/me', '14-me.png'],
  ['/me/profile', '15-me-profile.png'],
  ['/activities/act-001', '16-activity-detail.png'],
  ['/activities/act-001/register', '17-activity-register.png'],
]

const ORGANIZER_ROUTES = [
  ['/', '20-home-organizer.png'],
  ['/applications', '21-my-applications.png'],
  ['/applications/new', '22-application-new.png'],
  ['/activities/act-001/recruitment', '23-recruitment-edit.png'],
  ['/activities/act-001/registrations', '24-registration-review.png'],
  ['/activities/act-001/checkin', '25-checkin.png'],
  ['/activities/act-001/closure', '26-closure-apply.png'],
  ['/my/activities', '27-my-activities.png'],
]

const REVIEWER_ROUTES = [
  ['/approvals', '30-reviewer-inbox.png'],
  ['/approvals/app-001', '31-reviewer-detail.png'],
  ['/approvals/closures', '32-closure-inbox.png'],
  ['/closures/close-001/review', '33-closure-review.png'],
]

const ADMIN_ROUTES = [
  ['/admin', '40-admin-dashboard.png'],
  ['/admin/users', '41-admin-users.png'],
  ['/admin/users/u-organizer1', '42-admin-user-detail.png'],
  ['/admin/organizations', '43-admin-organizations.png'],
  ['/admin/role-applications', '44-admin-role-applications.png'],
  ['/admin/announcements', '45-admin-announcements.png'],
  ['/admin/system-logs', '46-admin-system-logs.png'],
]

// ---------- 入口 ----------

function resolveChromiumPath() {
  if (process.env.PLAYWRIGHT_CHROMIUM_PATH)
    return process.env.PLAYWRIGHT_CHROMIUM_PATH
  const candidates = [
    '/home/wangyuhan/.cache/ms-playwright/chromium-1217/chrome-linux64/chrome',
    '/usr/bin/chromium',
    '/usr/bin/google-chrome',
  ]
  for (const c of candidates) {
    if (existsSync(c)) return c
  }
  return undefined
}

async function checkFrontendReady() {
  try {
    const res = await fetch(APP, { method: 'GET' })
    return res.ok || res.status < 500
  } catch {
    return false
  }
}

async function main() {
  if (!(await checkFrontendReady())) {
    console.error(
      `[abort] 无法连接前端 ${APP}。请先运行 pnpm --filter @campus-activity/web dev`
    )
    process.exit(1)
  }
  const executablePath = resolveChromiumPath()
  if (!executablePath) {
    console.warn(
      '[warn] 未找到 Chromium。可设置 PLAYWRIGHT_CHROMIUM_PATH 或 npx playwright install chromium'
    )
  }
  const browser = await chromium.launch({
    executablePath,
    headless: args.headless,
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
  })
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    locale: 'zh-CN',
  })
  const page = await ctx.newPage()

  console.log('[config] API =', API, 'APP =', APP)
  console.log('[config] OUT =', OUT_DIR)

  // 公开路由
  await page.goto(APP).catch(() => {})
  await setSession(page, null)
  for (const [r, f] of PUBLIC_ROUTES) await shot(page, r, f)

  if (args.noAuth) {
    printSummary(results)
    await browser.close()
    return
  }

  const accounts = [
    ['student1', STUDENT_ROUTES],
    ['organizer1', ORGANIZER_ROUTES],
    ['reviewer1', REVIEWER_ROUTES],
    ['admin', ADMIN_ROUTES],
  ]

  for (const [u, routes] of accounts) {
    const s = await login(u)
    if (!s) {
      console.warn(
        `[skip] ${u} 登录失败，跳过该角色的截图。请检查后端是否在 ${API} 上运行，以及 seed 是否已导入。`
      )
      continue
    }
    await setSession(page, s)
    for (const [r, f] of routes) await shot(page, r, f)
  }

  await browser.close()
  printSummary(results)
}

function printSummary(rows) {
  const ok = rows.filter((r) => r.status === 'ok').length
  const skip = rows.filter((r) => r.status === 'skip').length
  const fail = rows.length - ok - skip
  console.log('\n=== Summary ===')
  console.log(`ok=${ok}  fail=${fail}  skip=${skip}  total=${rows.length}`)
  if (fail > 0) {
    console.log('\nFailures:')
    for (const r of rows.filter((x) => x.status !== 'ok' && x.status !== 'skip')) {
      console.log(
        ` - ${r.file} (${r.route}): ${r.status}${r.error ? ' / ' + r.error : ''}`
      )
    }
  }
  process.exitCode = fail > 0 ? 2 : 0
}

main().catch((err) => {
  console.error('[fatal]', err)
  process.exit(1)
})
