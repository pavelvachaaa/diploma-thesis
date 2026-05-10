import { serverApi } from './api-client'
import type {
  Organization,
  OrganizationsResponse,
  GetOrganizationsParams
} from '@/lib/api/organizations'

/**
 * Fetch organizations server-side with Next.js caching.
 * Uses 60-second cache by default for optimal performance.
 *
 * @param params - Query parameters (page, limit, search)
 * @param revalidate - Cache duration in seconds (default: 60)
 * @returns Organizations with pagination metadata
 *
 * @example
 * // Fetch with default 60-second cache
 * const { data, pagination } = await getOrganizationsServer({ page: 0, limit: 50 })
 *
 * // No caching (always fresh)
 * const { data, pagination } = await getOrganizationsServer({ page: 0 }, false)
 *
 * // Custom cache duration (5 minutes)
 * const { data, pagination } = await getOrganizationsServer({ page: 0 }, 300)
 */
export async function getOrganizationsServer(
  params?: GetOrganizationsParams,
  revalidate: number | false = 60
): Promise<OrganizationsResponse> {
  const queryParams = new URLSearchParams()

  if (params?.page !== undefined) {
    queryParams.append('page', params.page.toString())
  }
  if (params?.limit !== undefined) {
    queryParams.append('limit', params.limit.toString())
  }
  if (params?.search) {
    queryParams.append('search', params.search)
  }

  const queryString = queryParams.toString()
  const url = `/admin/organizations${queryString ? `?${queryString}` : ''}`

  return serverApi<OrganizationsResponse>(url, { revalidate, tags: ['organizations'] })
}

/**
 * Fetch single organization by ID server-side with caching.
 *
 * @param id - Organization UUID
 * @param revalidate - Cache duration in seconds (default: 60)
 * @returns Organization data
 *
 * @example
 * const organization = await getOrganizationByIdServer('uuid-here')
 */
export async function getOrganizationByIdServer(
  id: string,
  revalidate: number | false = 60
): Promise<Organization> {
  return serverApi<Organization>(`/admin/organizations/${id}`, { revalidate, tags: [`organization-${id}`]})
}
