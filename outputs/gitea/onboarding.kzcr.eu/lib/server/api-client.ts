import { cookies } from 'next/headers'

const BASE_URL = process.env.NODE_ENV === "production"
  ? 'https://onboarding.kzcr.eu/hrbackend/api/v1'
  : 'http://localhost:3322/api/v1'

const AUTH_COOKIE_NAME = 'auth_token'

interface ServerApiOptions extends RequestInit {
  revalidate?: number | false
  tags?: string[]
}

export async function serverApi<T>(path: string, options: ServerApiOptions = {}): Promise<T> {
  const cookieStore = await cookies()
  const token = cookieStore.get(AUTH_COOKIE_NAME)

  const cookieHeader = token ? `${token.name}=${token.value}` : ''

  const { revalidate, cache, tags, headers, ...restOptions } = options

  const baseHeaders: Record<string, string> = {
    ...headers as Record<string, string>,
  }

  if (cookieHeader) {
    baseHeaders['Cookie'] = cookieHeader
  }

  const fetchOptions: RequestInit = {
    ...restOptions,
    headers: baseHeaders
  }

  if (typeof revalidate === 'number' && revalidate > 0) {
    fetchOptions.next = { revalidate, tags: tags ?? [] }
  } else if (revalidate === 0 || revalidate === false) {
    fetchOptions.cache = 'no-store'
    if (tags) fetchOptions.next = { tags }
  } else if (cache) {
    fetchOptions.cache = cache
    if (tags) fetchOptions.next = { tags }
  } else {
    fetchOptions.cache = 'no-store'
  }

  const response = await fetch(`${BASE_URL}${path}`, fetchOptions)

  if (response.status === 204 || response.headers.get('content-length') === '0') {
    if (!response.ok) throw new Error('Server error')
    return undefined as T
  }

  const contentType = response.headers.get('content-type')

  if (contentType?.includes('application/json')) {
    const text = await response.text()

    try {
      const data = text ? JSON.parse(text) : {}

      if (!response.ok) {
        throw new Error(data?.error || `HTTP ${response.status}: ${response.statusText}`)
      }

      return data
    } catch (error) {
      if (error instanceof Error && error.message.startsWith('HTTP')) throw error
      if (error instanceof Error && !error.message.includes('JSON')) throw error // Rethrow specific API errors

      console.error('JSON Parse Error. Raw body:', text)
      throw new Error(`Invalid JSON response: ${text.substring(0, 100)}...`)
    }
  }

  const textResponse = await response.text()
  console.error(`API Error ${response.status} on ${path}:`, textResponse)
  throw new Error(`Expected JSON but got ${contentType}. Status: ${response.status}.`)
}