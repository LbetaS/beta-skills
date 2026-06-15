const DEFAULT_API_BASE_URL = 'http://127.0.0.1:8000'

export function resolveApiBaseUrl(configuredUrl?: string) {
  const normalized = configuredUrl?.trim().replace(/\/+$/, '')
  return normalized || DEFAULT_API_BASE_URL
}

export const API_BASE_URL = resolveApiBaseUrl(import.meta.env.VITE_API_BASE_URL)
