import axios from 'axios'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

export function getApiErrorMessage(err: unknown, fallback: string) {
  if (!axios.isAxiosError(err)) return fallback
  const data = err.response?.data
  if (!isRecord(data)) return fallback
  const error = data.error
  if (!isRecord(error)) return fallback
  const message = error.message
  return typeof message === 'string' && message ? message : fallback
}

