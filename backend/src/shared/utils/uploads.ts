import fs from 'node:fs'
import path from 'node:path'
import type { RequestHandler } from 'express'
import multer from 'multer'

const uploadRoot = path.join(process.cwd(), 'uploads')

if (!fs.existsSync(uploadRoot)) {
  fs.mkdirSync(uploadRoot, { recursive: true })
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadRoot)
  },
  filename: (_req, file, cb) => {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`
    cb(null, `${unique}-${safeName}`)
  },
})

export const uploadSingle: RequestHandler = multer({ storage }).single('file')

export function toPublicFileUrl(filename: string): string {
  return `/uploads/${filename}`
}
