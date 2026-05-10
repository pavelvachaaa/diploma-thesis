import { useCallback } from 'react'
import { useAdminContext } from '@/context/AdminContext'
import { 
  getEmployeeById, 
  getAllEmployees as getAllEmployeesAPI, 
  getEmployeeRoles,
  type Employee, 
  type EmployeesResponse,
  type EmployeesQuery,
  type EmployeeRole 
} from '@/lib/api/employees'
import { getEmployeeOnboardingDashboard } from '@/lib/api/admin-employee-onboarding'
import type { OnboardingDashboard } from '@/lib/api/employee_onboarding'

export function useAdminEmployees() {
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

  // Get single employee with caching
  const getEmployee = useCallback(async (employeeId: string): Promise<Employee | null> => {
    // Check cache first
    const cached = getFromCache('employees', employeeId)
    if (cached) return cached

    // Check if already loading
    if (isLoading('employees', employeeId)) return null

    try {
      setLoading('employees', employeeId, true)
      setError('employees', employeeId, null)

      const employee = await getEmployeeById(employeeId)
      setCache('employees', employeeId, employee)
      return employee
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Nepodařilo se načíst údaje zaměstnance'
      setError('employees', employeeId, errorMessage)
      return null
    } finally {
      setLoading('employees', employeeId, false)
    }
  }, [getFromCache, setCache, isLoading, setLoading, getError, setError])

  // Get all employees with caching and proper response format
  const getAllEmployeesList = useCallback(async (query: EmployeesQuery = {}, forceRefresh: boolean = false): Promise<EmployeesResponse> => {
    const cacheKey = `list_${JSON.stringify(query)}`
    
    // Check cache first (unless force refresh)
    if (!forceRefresh) {
      const cached = getFromCache('employees', cacheKey)
      if (cached) return cached
    }

    // Check if already loading
    if (isLoading('employees', cacheKey)) return { data: [], pagination: { page: 1, limit: 10, total: 0, totalPages: 0, hasNext: false, hasPrev: false } }

    try {
      setLoading('employees', cacheKey, true)
      setError('employees', cacheKey, null)

      const response = await getAllEmployeesAPI(query)

      // Cache the response
      setCache('employees', cacheKey, response)

      // Also cache individual employees
      const employeeMap: Record<string, Employee> = {}
      response.data.forEach((employee: Employee) => {
        employeeMap[employee.id] = employee
      })
      bulkSetCache('employees', employeeMap)

      return response
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Nepodařilo se načíst seznam zaměstnanců'
      setError('employees', cacheKey, errorMessage)
      return { data: [], pagination: { page: 1, limit: 10, total: 0, totalPages: 0, hasNext: false, hasPrev: false } }
    } finally {
      setLoading('employees', cacheKey, false)
    }
  }, [getFromCache, setCache, bulkSetCache, isLoading, setLoading, getError, setError])

  // Get employee roles with caching
  const getEmployeeRolesList = useCallback(async (): Promise<EmployeeRole[]> => {
    const cacheKey = 'roles_list'
    
    // Check cache first
    const cached = getFromCache('employees', cacheKey)
    if (cached) return cached

    // Check if already loading
    if (isLoading('employees', cacheKey)) return []

    try {
      setLoading('employees', cacheKey, true)
      setError('employees', cacheKey, null)

      const roles = await getEmployeeRoles()
      
      // Cache the roles
      setCache('employees', cacheKey, roles)
      
      return roles
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Nepodařilo se načíst seznam rolí'
      setError('employees', cacheKey, errorMessage)
      return []
    } finally {
      setLoading('employees', cacheKey, false)
    }
  }, [getFromCache, setCache, isLoading, setLoading, getError, setError])

  // Get employee onboarding dashboard
  const getEmployeeOnboarding = useCallback(async (employeeId: string): Promise<OnboardingDashboard | null> => {
    const cacheKey = `onboarding_${employeeId}`
    
    // Check cache first
    const cached = getFromCache('employees', cacheKey)
    if (cached) return cached

    // Check if already loading
    if (isLoading('employees', cacheKey)) return null

    try {
      setLoading('employees', cacheKey, true)
      setError('employees', cacheKey, null)

      const dashboard = await getEmployeeOnboardingDashboard(employeeId)
      setCache('employees', cacheKey, dashboard)
      return dashboard
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Nepodařilo se načíst onboarding data'
      setError('employees', cacheKey, errorMessage)
      return null
    } finally {
      setLoading('employees', cacheKey, false)
    }
  }, [getFromCache, setCache, isLoading, setLoading, getError, setError])

  // Invalidate employee cache
  const invalidateEmployee = useCallback((employeeId: string) => {
    setCache('employees', employeeId, undefined)
    setError('employees', employeeId, null)
  }, [setCache, setError])

  // Invalidate all employees cache
  const invalidateAllEmployees = useCallback(() => {
    // Clear all employee list caches using pattern matching
    setError('employees', 'list', null)
    clearCachePattern('employees', 'list_')
    
    console.log('🗑️ Cleared all employee list caches')
  }, [setError, clearCachePattern])

  // Helper functions for getting state
  const getEmployeeFromCache = useCallback((employeeId: string) => {
    return getFromCache('employees', employeeId)
  }, [getFromCache])

  const isEmployeeLoading = useCallback((employeeId: string) => {
    return isLoading('employees', employeeId)
  }, [isLoading])

  const getEmployeeError = useCallback((employeeId: string) => {
    return getError('employees', employeeId)
  }, [getError])

  // Force refresh method for when cache needs to be bypassed
  const refreshEmployees = useCallback(async (query: EmployeesQuery = {}): Promise<EmployeesResponse> => {
    return getAllEmployeesList(query, true) // Force refresh
  }, [getAllEmployeesList])

  // State helpers for actions
  const isActionLoading = useCallback((actionKey: string) => {
    return isLoading('employees', actionKey)
  }, [isLoading])

  const getActionError = useCallback((actionKey: string) => {
    return getError('employees', actionKey)
  }, [getError])

  return {
    // Data fetching
    getEmployee,
    getAllEmployeesList,
    getEmployeeRolesList,
    getEmployeeOnboarding,
    refreshEmployees,
    
    // Cache management
    invalidateEmployee,
    invalidateAllEmployees,
    
    // State helpers
    getEmployeeFromCache,
    isEmployeeLoading,
    getEmployeeError,
    isActionLoading,
    getActionError,
  }
}