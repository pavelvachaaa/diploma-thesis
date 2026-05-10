import { useCallback } from 'react'
import { useAdminContext } from '@/context/AdminContext'
import { 
  getAllWorkflows as getAllWorkflowsAPI,
  getWorkflowById,
  getWorkflowWithSteps,
  createWorkflow,
  updateWorkflow,
  deleteWorkflow,
  type OnboardingWorkflow,
  type WorkflowWithSteps,
  type WorkflowsQuery,
  type WorkflowsResponse
} from '@/lib/api/workflows'

export function useAdminWorkflows() {
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

  // Cache invalidation helpers (defined first to avoid forward reference issues)
  const invalidateWorkflow = useCallback((workflowId: string) => {
    setCache('workflows', workflowId, undefined)
    setCache('workflows', `${workflowId}_with_steps`, undefined)
    setError('workflows', workflowId, null)
  }, [setCache, setError])

  const invalidateAllWorkflows = useCallback(() => {
    // Clear all workflow list caches using pattern matching
    // This is much more efficient and comprehensive
    setError('workflows', 'list', null)
    clearCachePattern('workflows', 'list_')
    
    console.log('🗑️ Cleared all workflow list caches')
  }, [setError, clearCachePattern])

  // Get all workflows with caching
  const getAllWorkflows = useCallback(async (query: WorkflowsQuery = {}, forceRefresh: boolean = false): Promise<WorkflowsResponse> => {
    const cacheKey = `list_${JSON.stringify(query)}`
    
    // Check cache first (unless force refresh)
    if (!forceRefresh) {
      const cached = getFromCache('workflows', cacheKey)
      if (cached) return cached
    }

    // Check if already loading
    if (isLoading('workflows', cacheKey)) return { data: [], pagination: { page: 1, limit: 10, total: 0, totalPages: 0 } }

    try {
      setLoading('workflows', cacheKey, true)
      setError('workflows', cacheKey, null)

      const response = await getAllWorkflowsAPI(query)
      
      // Cache the response
      setCache('workflows', cacheKey, response)

      // Also cache individual workflows
      const workflowMap: Record<string, OnboardingWorkflow> = {}
      response.data.forEach((workflow: OnboardingWorkflow) => {
        workflowMap[workflow.id] = workflow
      })
      bulkSetCache('workflows', workflowMap)

      return response
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Nepodařilo se načíst seznam workflows'
      setError('workflows', cacheKey, errorMessage)
      return { data: [], pagination: { page: 1, limit: 10, total: 0, totalPages: 0 } }
    } finally {
      setLoading('workflows', cacheKey, false)
    }
  }, [getFromCache, setCache, bulkSetCache, isLoading, setLoading, getError, setError])

  // Get single workflow with caching
  const getWorkflow = useCallback(async (workflowId: string): Promise<OnboardingWorkflow | null> => {
    // Check cache first
    const cached = getFromCache('workflows', workflowId)
    if (cached) return cached

    // Check if already loading
    if (isLoading('workflows', workflowId)) return null

    try {
      setLoading('workflows', workflowId, true)
      setError('workflows', workflowId, null)

      const workflow = await getWorkflowById(workflowId)
      setCache('workflows', workflowId, workflow)
      return workflow
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Nepodařilo se načíst workflow'
      setError('workflows', workflowId, errorMessage)
      return null
    } finally {
      setLoading('workflows', workflowId, false)
    }
  }, [getFromCache, setCache, isLoading, setLoading, getError, setError])

  // Get workflow with steps
  const getWorkflowWithStepsData = useCallback(async (workflowId: string): Promise<WorkflowWithSteps | null> => {
    const cacheKey = `${workflowId}_with_steps`
    
    // Check cache first
    const cached = getFromCache('workflows', cacheKey)
    if (cached) return cached

    // Check if already loading
    if (isLoading('workflows', cacheKey)) return null

    try {
      setLoading('workflows', cacheKey, true)
      setError('workflows', cacheKey, null)

      const workflowWithSteps = await getWorkflowWithSteps(workflowId)
      setCache('workflows', cacheKey, workflowWithSteps)
      return workflowWithSteps
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Nepodařilo se načíst workflow s kroky'
      setError('workflows', cacheKey, errorMessage)
      return null
    } finally {
      setLoading('workflows', cacheKey, false)
    }
  }, [getFromCache, setCache, isLoading, setLoading, getError, setError])

  // Create new workflow
  const createNewWorkflow = useCallback(async (workflowData: Partial<OnboardingWorkflow>): Promise<OnboardingWorkflow | null> => {
    const actionKey = 'create_workflow'
    
    try {
      setLoading('workflows', actionKey, true)
      setError('workflows', actionKey, null)

      const newWorkflow = await createWorkflow(workflowData)
      
      // Add to cache
      setCache('workflows', newWorkflow.id, newWorkflow)
      
      // Invalidate list caches to include new workflow
      invalidateAllWorkflows()
      
      // Clear all list caches more aggressively
      setTimeout(() => {
        invalidateAllWorkflows()
      }, 100)
      
      return newWorkflow
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Nepodařilo se vytvořit workflow'
      setError('workflows', actionKey, errorMessage)
      return null
    } finally {
      setLoading('workflows', actionKey, false)
    }
  }, [setCache, setLoading, setError])

  // Update existing workflow
  const updateExistingWorkflow = useCallback(async (
    workflowId: string, 
    workflowData: Partial<OnboardingWorkflow>
  ): Promise<boolean> => {
    const actionKey = `update_${workflowId}`
    
    try {
      setLoading('workflows', actionKey, true)
      setError('workflows', actionKey, null)

      const updatedWorkflow = await updateWorkflow(workflowId, workflowData)
      
      // Update cache
      setCache('workflows', workflowId, updatedWorkflow)
      
      // Invalidate related caches
      setCache('workflows', `${workflowId}_with_steps`, undefined)
      invalidateAllWorkflows()
      
      // Clear all list caches more aggressively
      setTimeout(() => {
        invalidateAllWorkflows()
      }, 100)
      
      return true
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Nepodařilo se aktualizovat workflow'
      setError('workflows', actionKey, errorMessage)
      return false
    } finally {
      setLoading('workflows', actionKey, false)
    }
  }, [setCache, setLoading, setError])

  // Delete workflow
  const deleteExistingWorkflow = useCallback(async (workflowId: string): Promise<boolean> => {
    const actionKey = `delete_${workflowId}`
    
    try {
      setLoading('workflows', actionKey, true)
      setError('workflows', actionKey, null)

      await deleteWorkflow(workflowId)
      
      // Remove from cache
      setCache('workflows', workflowId, undefined)
      setCache('workflows', `${workflowId}_with_steps`, undefined)
      
      // Invalidate list cache
      invalidateAllWorkflows()
      
      // Clear all list caches more aggressively
      setTimeout(() => {
        invalidateAllWorkflows()
      }, 100)
      
      return true
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Nepodařilo se smazat workflow'
      setError('workflows', actionKey, errorMessage)
      return false
    } finally {
      setLoading('workflows', actionKey, false)
    }
  }, [setCache, setLoading, setError])


  // State helpers
  const getWorkflowFromCache = useCallback((workflowId: string) => {
    return getFromCache('workflows', workflowId)
  }, [getFromCache])

  const getWorkflowWithStepsFromCache = useCallback((workflowId: string) => {
    return getFromCache('workflows', `${workflowId}_with_steps`)
  }, [getFromCache])

  const isWorkflowLoading = useCallback((workflowId: string) => {
    return isLoading('workflows', workflowId)
  }, [isLoading])

  const getWorkflowError = useCallback((workflowId: string) => {
    return getError('workflows', workflowId)
  }, [getError])

  const isActionLoading = useCallback((actionKey: string) => {
    return isLoading('workflows', actionKey)
  }, [isLoading])

  const getActionError = useCallback((actionKey: string) => {
    return getError('workflows', actionKey)
  }, [getError])

  // Force refresh method for when cache needs to be bypassed
  const refreshWorkflows = useCallback(async (query: WorkflowsQuery = {}): Promise<WorkflowsResponse> => {
    return getAllWorkflows(query, true) // Force refresh
  }, [getAllWorkflows])

  return {
    // Data fetching
    getAllWorkflows,
    getWorkflow,
    getWorkflowWithStepsData,
    refreshWorkflows,
    
    // CRUD operations
    createNewWorkflow,
    updateExistingWorkflow,
    deleteExistingWorkflow,
    
    // Cache management
    invalidateWorkflow,
    invalidateAllWorkflows,
    
    // State helpers
    getWorkflowFromCache,
    getWorkflowWithStepsFromCache,
    isWorkflowLoading,
    getWorkflowError,
    isActionLoading,
    getActionError,
  }
}