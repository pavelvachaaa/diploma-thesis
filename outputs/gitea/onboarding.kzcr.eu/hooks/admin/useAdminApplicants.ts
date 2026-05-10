import { useCallback } from 'react'
import { useAdminContext } from '@/context/AdminContext'
import { 
  getAllApplicants,
  getApplicantsByJob,
  getApplicantById,
  updateApplicantStatus,
  createApplicantNote,
  updateAttachmentStatus,
  downloadAttachment,
  type Applicant,
  type ApplicantNote,
  type ApplicantsQuery,
  type ApplicantsResponse,
  type CreateNoteData
} from '@/lib/api/applicants'

export function useAdminApplicants() {
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

  // Get all applicants with caching
  const getAllApplicantsList = useCallback(async (query: ApplicantsQuery = {}, forceRefresh: boolean = false): Promise<ApplicantsResponse> => {
    const cacheKey = `list_${JSON.stringify(query)}`
    
    // Check cache first (unless force refresh)
    if (!forceRefresh) {
      const cached = getFromCache('applicants', cacheKey)
      if (cached) return cached
    }

    // Check if already loading
    if (isLoading('applicants', cacheKey)) return { data: [], pagination: { page: 1, limit: 10, total: 0, totalPages: 0 } }

    try {
      setLoading('applicants', cacheKey, true)
      setError('applicants', cacheKey, null)

      const response = await getAllApplicants(query)

      // Cache the response
      setCache('applicants', cacheKey, response)

      // Also cache individual applicants
      const applicantMap: Record<string, Applicant> = {}
      response.data.forEach((applicant: Applicant) => {
        applicantMap[applicant.id] = applicant
      })
      bulkSetCache('applicants', applicantMap)

      return response
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Nepodařilo se načíst seznam uchazečů'
      setError('applicants', cacheKey, errorMessage)
      return { data: [], pagination: { page: 1, limit: 10, total: 0, totalPages: 0 } }
    } finally {
      setLoading('applicants', cacheKey, false)
    }
  }, [getFromCache, setCache, bulkSetCache, isLoading, setLoading, getError, setError])

  // Get applicants for a job with caching
  const getJobApplicantList = useCallback(async (jobId: string): Promise<Applicant[]> => {
    const cacheKey = `job_${jobId}_applicants`
    
    // Check cache first
    const cached = getFromCache('applicants', cacheKey)
    if (cached) return cached

    // Check if already loading
    if (isLoading('applicants', cacheKey)) return []

    try {
      setLoading('applicants', cacheKey, true)
      setError('applicants', cacheKey, null)

      const applicants = await getApplicantsByJob(jobId)
      
      // Cache the list
      setCache('applicants', cacheKey, applicants)

      // Also cache individual applicants
      const applicantMap: Record<string, Applicant> = {}
      applicants.forEach((applicant: Applicant) => {
        applicantMap[applicant.id] = applicant
      })
      bulkSetCache('applicants', applicantMap)

      return applicants
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Nepodařilo se načíst seznam uchazečů'
      setError('applicants', cacheKey, errorMessage)
      return []
    } finally {
      setLoading('applicants', cacheKey, false)
    }
  }, [getFromCache, setCache, bulkSetCache, isLoading, setLoading, getError, setError])

  // Get single applicant with caching
  const getApplicant = useCallback(async (applicantId: string): Promise<Applicant | null> => {
    // Check cache first
    const cached = getFromCache('applicants', applicantId)
    if (cached) return cached

    // Check if already loading
    if (isLoading('applicants', applicantId)) return null

    try {
      setLoading('applicants', applicantId, true)
      setError('applicants', applicantId, null)

      const applicant = await getApplicantById(applicantId)
      setCache('applicants', applicantId, applicant)
      return applicant
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Nepodařilo se načíst údaje uchazeče'
      setError('applicants', applicantId, errorMessage)
      return null
    } finally {
      setLoading('applicants', applicantId, false)
    }
  }, [getFromCache, setCache, isLoading, setLoading, getError, setError])

  // Cache invalidation helpers (moved here to avoid circular dependency)
  const invalidateApplicant = useCallback((applicantId: string) => {
    setCache('applicants', applicantId, undefined)
    setError('applicants', applicantId, null)
  }, [setCache, setError])

  const invalidateJobApplicants = useCallback((jobId: string) => {
    const cacheKey = `job_${jobId}_applicants`
    setCache('applicants', cacheKey, undefined)
    setError('applicants', cacheKey, null)
  }, [setCache, setError])

  const invalidateAllApplicants = useCallback(() => {
    // Clear all applicant list caches using pattern matching
    setError('applicants', 'list', null)
    clearCachePattern('applicants', 'list_')
    clearCachePattern('applicants', 'job_')
    
    console.log('🗑️ Cleared all applicant list caches')
  }, [setError, clearCachePattern])

  // Update applicant status with optimistic updates
  const updateStatus = useCallback(async (
    applicantId: string, 
    statusName: string, 
    notes?: string
  ): Promise<boolean> => {
    const actionKey = `update_status_${applicantId}`
    
    try {
      setLoading('applicants', actionKey, true)
      setError('applicants', actionKey, null)

      await updateApplicantStatus(applicantId, { status: statusName, notes })
      
      // Invalidate cache to force refresh
      invalidateApplicant(applicantId)
      
      // IMPORTANT: Also invalidate all list caches since the applicant appears in lists
      invalidateAllApplicants()
      
      return true
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Nepodařilo se aktualizovat stav uchazeče'
      setError('applicants', actionKey, errorMessage)
      return false
    } finally {
      setLoading('applicants', actionKey, false)
    }
  }, [setLoading, setError, invalidateApplicant, invalidateAllApplicants])

  // Add note to applicant
  const addNote = useCallback(async (
    applicantId: string, 
    noteData: CreateNoteData
  ): Promise<boolean> => {
    const actionKey = `add_note_${applicantId}`
    
    try {
      setLoading('applicants', actionKey, true)
      setError('applicants', actionKey, null)

      await createApplicantNote(applicantId, noteData)
      
      // Invalidate cache to force refresh
      invalidateApplicant(applicantId)
      
      return true
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Nepodařilo se přidat poznámku'
      setError('applicants', actionKey, errorMessage)
      return false
    } finally {
      setLoading('applicants', actionKey, false)
    }
  }, [setLoading, setError])

  // Update attachment status
  const updateAttachment = useCallback(async (
    attachmentId: string,
    status: string,
    notes?: string
  ): Promise<boolean> => {
    const actionKey = `update_attachment_${attachmentId}`
    
    try {
      setLoading('applicants', actionKey, true)
      setError('applicants', actionKey, null)

      await updateAttachmentStatus(attachmentId, { status, review_notes: notes })
      
      // Note: We don't know which applicant this belongs to, so we can't invalidate specific cache
      // The calling component should handle cache invalidation if needed
      
      return true
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Nepodařilo se aktualizovat stav dokumentu'
      setError('applicants', actionKey, errorMessage)
      return false
    } finally {
      setLoading('applicants', actionKey, false)
    }
  }, [setLoading, setError])

  // Download attachment
  const downloadFile = useCallback(async (
    attachmentId: string, 
    filename: string
  ): Promise<boolean> => {
    const actionKey = `download_${attachmentId}`
    
    try {
      setLoading('applicants', actionKey, true)
      setError('applicants', actionKey, null)

      await downloadAttachment(attachmentId, filename)
      return true
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Nepodařilo se stáhnout soubor'
      setError('applicants', actionKey, errorMessage)
      return false
    } finally {
      setLoading('applicants', actionKey, false)
    }
  }, [setLoading, setError])

  // State helpers
  const getApplicantFromCache = useCallback((applicantId: string) => {
    return getFromCache('applicants', applicantId)
  }, [getFromCache])

  const isApplicantLoading = useCallback((applicantId: string) => {
    return isLoading('applicants', applicantId)
  }, [isLoading])

  const getApplicantError = useCallback((applicantId: string) => {
    return getError('applicants', applicantId)
  }, [getError])

  const isActionLoading = useCallback((actionKey: string) => {
    return isLoading('applicants', actionKey)
  }, [isLoading])

  const getActionError = useCallback((actionKey: string) => {
    return getError('applicants', actionKey)
  }, [getError])

  // Force refresh method for when cache needs to be bypassed
  const refreshApplicants = useCallback(async (query: ApplicantsQuery = {}): Promise<ApplicantsResponse> => {
    return getAllApplicantsList(query, true) // Force refresh
  }, [getAllApplicantsList])

  return {
    // Data fetching
    getAllApplicantsList,
    getJobApplicantList,
    getApplicant,
    refreshApplicants,
    
    // Actions
    updateStatus,
    addNote,
    updateAttachment,
    downloadFile,
    
    // Cache management
    invalidateApplicant,
    invalidateJobApplicants,
    invalidateAllApplicants,
    
    // State helpers
    getApplicantFromCache,
    isApplicantLoading,
    getApplicantError,
    isActionLoading,
    getActionError,
  }
}