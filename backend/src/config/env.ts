import { z } from 'zod'

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  DATABASE_URL: z
    .string()
    .default('postgresql://campus:campus_dev_2026@localhost:5432/campus?schema=public'),
})

export type Env = z.infer<typeof envSchema>

export const env: Env = envSchema.parse(process.env)

