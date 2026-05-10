export const API_BASE_URL = (
  process.env.NODE_ENV === 'production'
    ? (process.env.NEXT_PUBLIC_BASE_API_URL_PROD || 'https://onboarding.kzcr.eu/hrbackend/api/v1')
    : (process.env.NEXT_PUBLIC_BASE_API_URL_DEV || 'http://localhost:3322/api/v1')
).trim()

export const buildApiUrl = (path: string) => `${API_BASE_URL}${path}`
