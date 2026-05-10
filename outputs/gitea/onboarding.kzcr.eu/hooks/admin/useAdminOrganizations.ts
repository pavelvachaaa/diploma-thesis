import { useCallback } from 'react'
import { useAdminContext } from '@/context/AdminContext'
import {
  getAllOrganizations as getAllOrganizationsAPI,
  getOrganizationById as getOrganizationByIdAPI,
  createOrganization as createOrganizationAPI,
  updateOrganization as updateOrganizationAPI,
  deleteOrganization as deleteOrganizationAPI,
  type Organization,
  type OrganizationsResponse,
  type GetOrganizationsParams
} from '@/lib/api/organizations'

export function useAdminOrganizations() {
  const {
    getFromCache,
    setCache,
    bulkSetCache,
    isLoading,
    setLoading,
    getError,
    setError,
    clearCachePattern,
  } = useAdminContext()

  // Get single organization with caching
  const getOrganization = useCallback(async (organizationId: string): Promise<Organization | null> => {
    // Check cache first
    const cached = getFromCache('organizations', organizationId)
    if (cached) return cached

    // Check if already loading
    if (isLoading('organizations', organizationId)) return null

    try {
      setLoading('organizations', organizationId, true)
      setError('organizations', organizationId, null)

      const organization = await getOrganizationByIdAPI(organizationId)
      setCache('organizations', organizationId, organization)
      return organization
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Nepodařilo se načíst údaje organizace'
      setError('organizations', organizationId, errorMessage)
      return null
    } finally {
      setLoading('organizations', organizationId, false)
    }
  }, [getFromCache, setCache, isLoading, setLoading, setError])

  // Get all organizations with caching and proper response format
  const getAllOrganizations = useCallback(async (params: GetOrganizationsParams = {}, forceRefresh: boolean = false): Promise<OrganizationsResponse> => {
    const cacheKey = `list_${JSON.stringify(params)}`

    // Check cache first (unless force refresh)
    if (!forceRefresh) {
      const cached = getFromCache('organizations', cacheKey)
      if (cached) return cached
    }

    // Check if already loading
    if (isLoading('organizations', cacheKey)) {
      return {
        data: [],
        pagination: {
          page: 0,
          limit: 50,
          total: 0,
          totalPages: 0,
          hasNext: false,
          hasPrev: false
        }
      }
    }

    try {
      setLoading('organizations', cacheKey, true)
      setError('organizations', cacheKey, null)

      const response = await getAllOrganizationsAPI(params)

      // Cache the response
      setCache('organizations', cacheKey, response)

      // Also cache individual organizations
      const organizationMap: Record<string, Organization> = {}
      response.data.forEach((organization: Organization) => {
        organizationMap[organization.id] = organization
      })
      bulkSetCache('organizations', organizationMap)

      return response
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Nepodařilo se načíst seznam organizací'
      setError('organizations', cacheKey, errorMessage)
      return {
        data: [],
        pagination: {
          page: 0,
          limit: 50,
          total: 0,
          totalPages: 0,
          hasNext: false,
          hasPrev: false
        }
      }
    } finally {
      setLoading('organizations', cacheKey, false)
    }
  }, [getFromCache, setCache, bulkSetCache, isLoading, setLoading, setError])

  // Create new organization
  const createOrganization = useCallback(async (organizationData: Partial<Organization>): Promise<Organization | null> => {
    const cacheKey = 'create'

    try {
      setLoading('organizations', cacheKey, true)
      setError('organizations', cacheKey, null)

      const organization = await createOrganizationAPI(organizationData)

      // Cache the new organization
      setCache('organizations', organization.id, organization)

      // Clear list cache to force refresh
      clearCachePattern('organizations', 'list_')

      return organization
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Nepodařilo se vytvořit organizaci'
      setError('organizations', cacheKey, errorMessage)
      throw error
    } finally {
      setLoading('organizations', cacheKey, false)
    }
  }, [setCache, setLoading, setError, clearCachePattern])

  // Update organization
  const updateOrganization = useCallback(async (organizationId: string, organizationData: Partial<Organization>): Promise<Organization | null> => {
    const cacheKey = `update_${organizationId}`

    try {
      setLoading('organizations', cacheKey, true)
      setError('organizations', cacheKey, null)

      const organization = await updateOrganizationAPI(organizationId, organizationData)

      // Update cache
      setCache('organizations', organizationId, organization)

      // Clear list cache to force refresh
      clearCachePattern('organizations', 'list_')

      return organization
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Nepodařilo se upravit organizaci'
      setError('organizations', cacheKey, errorMessage)
      throw error
    } finally {
      setLoading('organizations', cacheKey, false)
    }
  }, [setCache, setLoading, setError, clearCachePattern])

  // Delete organization
  const deleteOrganization = useCallback(async (organizationId: string): Promise<void> => {
    const cacheKey = `delete_${organizationId}`

    try {
      setLoading('organizations', cacheKey, true)
      setError('organizations', cacheKey, null)

      await deleteOrganizationAPI(organizationId)

      // Remove from cache
      setCache('organizations', organizationId, null)

      // Clear list cache to force refresh
      clearCachePattern('organizations', 'list_')
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Nepodařilo se smazat organizaci'
      setError('organizations', cacheKey, errorMessage)
      throw error
    } finally {
      setLoading('organizations', cacheKey, false)
    }
  }, [setCache, setLoading, setError, clearCachePattern])

  return {
    getOrganization,
    getAllOrganizations,
    createOrganization,
    updateOrganization,
    deleteOrganization,
    isOrganizationLoading: (id: string) => isLoading('organizations', id),
    getOrganizationError: (id: string) => getError('organizations', id),
  }
}
