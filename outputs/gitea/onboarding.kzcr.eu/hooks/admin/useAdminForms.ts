import { useCallback } from 'react'
import { useAdminContext } from '@/context/AdminContext'
import { 
  getAllSteps,
  createStep,
  updateStep,
  deleteStep,
  type OnboardingStep
} from '@/lib/api/workflows'

export function useAdminForms() {
  const {
    getFromCache,
    setCache,
    isLoading,
    setLoading,
    getError,
    setError,
    clearCachePattern,
  } = useAdminContext()

  // Get all forms/steps for current organization with caching
  const getAllForms = useCallback(async (organizationId: string): Promise<OnboardingStep[]> => {
    const cacheKey = `all_steps_${organizationId}`
    
    // Check cache first
    const cached = getFromCache('forms', cacheKey)
    if (cached) return cached

    // Check if already loading
    if (isLoading('forms', cacheKey)) return []

    try {
      setLoading('forms', cacheKey, true)
      setError('forms', cacheKey, null)

      const steps = await getAllSteps(organizationId)
      
      // Cache the list
      setCache('forms', cacheKey, steps)
      
      // Also cache individual steps
      steps.forEach(step => {
        setCache('forms', step.id, step)
      })
      
      return steps
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Nepodařilo se načíst formuláře'
      setError('forms', cacheKey, errorMessage)
      return []
    } finally {
      setLoading('forms', cacheKey, false)
    }
  }, [getFromCache, setCache, isLoading, setLoading, getError, setError])

  // Get all forms/steps across all organizations for forms management
  const getAllFormsAdmin = useCallback(async (forceRefresh: boolean = false): Promise<OnboardingStep[]> => {
    const cacheKey = 'all_forms_admin'
    
    // Check cache first (unless force refresh)
    if (!forceRefresh) {
      const cached = getFromCache('forms', cacheKey)
      if (cached) return cached
    }

    // Check if already loading
    if (isLoading('forms', cacheKey)) return []

    try {
      setLoading('forms', cacheKey, true)
      setError('forms', cacheKey, null)

      // For now, we'll need to get steps for a default organization
      // TODO: This should be updated when backend supports getting all forms across orgs
      const steps = await getAllSteps('default-org-id') // Placeholder
      
      // Cache the list
      setCache('forms', cacheKey, steps)
      
      // Also cache individual steps
      steps.forEach(step => {
        setCache('forms', step.id, step)
      })
      
      return steps
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Nepodařilo se načíst formuláře'
      setError('forms', cacheKey, errorMessage)
      return []
    } finally {
      setLoading('forms', cacheKey, false)
    }
  }, [getFromCache, setCache, isLoading, setLoading, getError, setError])

  // Get single form from cache or fetch all if needed
  const getForm = useCallback(async (stepId: string, organizationId?: string): Promise<OnboardingStep | null> => {
    // Check cache first
    const cached = getFromCache('forms', stepId)
    if (cached) return cached

    // If we have organizationId, try to fetch all steps and find the one we need
    if (organizationId) {
      const steps = await getAllForms(organizationId)
      return steps.find(step => step.id === stepId) || null
    }

    return null
  }, [getFromCache, getAllForms])

  // Update form JSONB data
  const updateFormData = useCallback(async (
    stepId: string, 
    formData: any
  ): Promise<boolean> => {
    const actionKey = `update_form_${stepId}`
    
    try {
      setLoading('forms', actionKey, true)
      setError('forms', actionKey, null)

      // Update step with new metadata containing form data
      const cached = getFromCache('forms', stepId)
      const updatedStepData = {
        ...cached,
        metadata: { 
          ...cached?.metadata, 
          form: formData 
        }
      }
      
      await updateStep(stepId, updatedStepData)
      
      // Update cached form data
      setCache('forms', stepId, updatedStepData)
      
      return true
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Nepodařilo se aktualizovat formulář'
      setError('forms', actionKey, errorMessage)
      return false
    } finally {
      setLoading('forms', actionKey, false)
    }
  }, [getFromCache, setCache, setLoading, setError])

  // Create new form/step
  const createNewForm = useCallback(async (stepData: Partial<OnboardingStep>): Promise<OnboardingStep | null> => {
    const actionKey = 'create_form'
    
    try {
      setLoading('forms', actionKey, true)
      setError('forms', actionKey, null)

      const newStep = await createStep(stepData)
      
      // Add to cache
      setCache('forms', newStep.id, newStep)
      
      return newStep
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Nepodařilo se vytvořit formulář'
      setError('forms', actionKey, errorMessage)
      return null
    } finally {
      setLoading('forms', actionKey, false)
    }
  }, [setCache, setLoading, setError])

  // Update existing form/step
  const updateForm = useCallback(async (
    stepId: string, 
    stepData: Partial<OnboardingStep>
  ): Promise<boolean> => {
    const actionKey = `update_step_${stepId}`
    
    try {
      setLoading('forms', actionKey, true)
      setError('forms', actionKey, null)

      const updatedStep = await updateStep(stepId, stepData)
      
      // Update cache
      setCache('forms', stepId, updatedStep)
      
      return true
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Nepodařilo se aktualizovat formulář'
      setError('forms', actionKey, errorMessage)
      return false
    } finally {
      setLoading('forms', actionKey, false)
    }
  }, [setCache, setLoading, setError])

  // Delete form/step
  const deleteForm = useCallback(async (stepId: string): Promise<boolean> => {
    const actionKey = `delete_${stepId}`
    
    try {
      setLoading('forms', actionKey, true)
      setError('forms', actionKey, null)

      await deleteStep(stepId)
      
      // Remove from cache
      setCache('forms', stepId, undefined)
      
      return true
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Nepodařilo se smazat formulář'
      setError('forms', actionKey, errorMessage)
      return false
    } finally {
      setLoading('forms', actionKey, false)
    }
  }, [setCache, setLoading, setError])

  // Cache invalidation helpers
  const invalidateForm = useCallback((stepId: string) => {
    setCache('forms', stepId, undefined)
    setError('forms', stepId, null)
  }, [setCache, setError])

  const invalidateAllForms = useCallback(() => {
    // Clear all form list caches using pattern matching
    setError('forms', 'list', null)
    clearCachePattern('forms', 'all_steps_')
    
    console.log('🗑️ Cleared all form list caches')
  }, [setError, clearCachePattern])

  // State helpers
  const getFormFromCache = useCallback((stepId: string) => {
    return getFromCache('forms', stepId)
  }, [getFromCache])

  const isFormLoading = useCallback((stepId: string) => {
    return isLoading('forms', stepId)
  }, [isLoading])

  const getFormError = useCallback((stepId: string) => {
    return getError('forms', stepId)
  }, [getError])

  const isActionLoading = useCallback((actionKey: string) => {
    return isLoading('forms', actionKey)
  }, [isLoading])

  const getActionError = useCallback((actionKey: string) => {
    return getError('forms', actionKey)
  }, [getError])

  // Force refresh method for when cache needs to be bypassed
  const refreshForms = useCallback(async (): Promise<OnboardingStep[]> => {
    return getAllFormsAdmin(true) // Force refresh
  }, [getAllFormsAdmin])

  return {
    // Data fetching
    getAllForms,
    getAllFormsAdmin,
    getForm,
    refreshForms,
    
    // Form operations
    updateFormData,
    createNewForm,
    updateForm,
    deleteForm,
    
    // Cache management
    invalidateForm,
    invalidateAllForms,
    
    // State helpers
    getFormFromCache,
    isFormLoading,
    getFormError,
    isActionLoading,
    getActionError,
  }
}