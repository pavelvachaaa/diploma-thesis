import { cache } from 'react'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { serverApi } from './api-client'

export interface AuthUser {
  userId: string
  email: string
  fullName: string
  organization: string
  role?: string
  roles: string[]
}

/**
 * wrapped in React's cache() to deduplicate requests within a single render pass.
 */
const fetchUserCached = cache(async () => {
  try {
    const cookieStore = await cookies()
    const authToken = cookieStore.get('auth_token')

    if (!authToken) return null

    return await serverApi<AuthUser>('/auth/me')
  } catch (error) {
    // Log actual errors, but return null so the caller decides (redirect vs null)
    console.error('Auth fetch failed:', error)
    return null
  }
})

/**
 * Validates JWT token and returns authenticated user.
 * Redirects to /login if not authenticated.
 */
export async function requireAuth(allowedRoles?: string[]): Promise<AuthUser> {
  const user = await fetchUserCached()

  if (!user) {
    redirect('/login')
  }

  if (allowedRoles && allowedRoles.length > 0) {
    const hasRole = user.roles.some(role => allowedRoles.includes(role))

    if (!hasRole) {
      redirect('/login?error=insufficient_permissions')
    }
  }

  return user
}

/**
 * Optional auth check - returns user or null.
 * Efficiently reuses the same data fetch as requireAuth.
 */
export async function getAuthUser(): Promise<AuthUser | null> {
  return fetchUserCached()
}
