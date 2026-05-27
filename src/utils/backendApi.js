const trimSlashEnd = (value) => String(value || '').trim().replace(/\/+$/, '')

export const BACKEND_API_BASE_URL = trimSlashEnd(import.meta.env?.VITE_BACKEND_API_BASE_URL || '')

export const backendUrl = (path) => {
  const cleanPath = String(path || '').startsWith('/') ? path : `/${path}`
  return `${BACKEND_API_BASE_URL}${cleanPath}`
}

const readJsonBody = async (response) => {
  try {
    return await response.json()
  } catch {
    return null
  }
}

const errorMessageFrom = (response, data) => {
  return data?.detail
    || data?.error?.message
    || data?.message
    || data?.msg
    || `${response.status} ${response.statusText}`.trim()
}

export const backendJson = async (path, options = {}) => {
  const response = await fetch(backendUrl(path), {
    ...options,
    headers: {
      Accept: 'application/json',
      ...(options.headers || {}),
    },
  })
  const data = await readJsonBody(response)

  if (!response.ok) {
    throw new Error(errorMessageFrom(response, data))
  }

  return data
}

export const fetchBackendHealth = () => backendJson('/health')

export const fetchChjCacheStatus = () => backendJson('/api/chj/cache/status')
