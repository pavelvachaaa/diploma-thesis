import { useState, useCallback } from 'react'
import {
  getAllJobsAdmin,
  getJobById,
  createJob,
  updateJob,
  deleteJob,
  getJobApplicants,
  type Job,
  type JobsResponse,
  type JobsQuery
} from '@/lib/api/jobs'

const EMPTY_PAGINATION = {
  page: 0,
  limit: 10,
  total: 0,
  totalPages: 0,
  hasNext: false,
  hasPrev: false
}

export function useAdminJobs() {
  const [loading, setLoading] = useState<Record<string, boolean>>({})
  const [errors, setErrors] = useState<Record<string, string | null>>({})

  // Generic async handler with loading/error tracking
  const handleAsync = async <T,>(
    key: string,
    operation: () => Promise<T>,
    fallback: T
  ): Promise<T> => {
    try {
      setLoading(prev => ({ ...prev, [key]: true }))
      setErrors(prev => ({ ...prev, [key]: null }))
      return await operation()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Operace selhala'
      setErrors(prev => ({ ...prev, [key]: message }))
      return fallback
    } finally {
      setLoading(prev => ({ ...prev, [key]: false }))
    }
  }

  const getAllJobs = useCallback((query: JobsQuery = {}): Promise<JobsResponse> => {
    return handleAsync(
      'list',
      async () => {
        const response = await getAllJobsAdmin(query)

        // Normalize response
        if (Array.isArray(response)) {
          return {
            data: response,
            pagination: {
              page: 0,
              limit: response.length,
              total: response.length,
              totalPages: 1,
              hasNext: false,
              hasPrev: false
            }
          }
        }

        return response
      },
      { data: [], pagination: EMPTY_PAGINATION }
    )
  }, [])

  const getJob = useCallback((jobId: string): Promise<Job | null> => {
    return handleAsync(jobId, () => getJobById(jobId), null)
  }, [])

  const createNewJob = useCallback((jobData: Partial<Job>): Promise<Job | null> => {
    return handleAsync('create_job', () => createJob(jobData), null)
  }, [])

  const updateExistingJob = useCallback(async (jobId: string, jobData: Partial<Job>): Promise<boolean> => {
    const result = await handleAsync(`update_${jobId}`, () => updateJob(jobId, jobData), null)
    return result !== null
  }, [])

  const deleteExistingJob = useCallback(async (jobId: string): Promise<boolean> => {
    const result = await handleAsync(`delete_${jobId}`, () => deleteJob(jobId), null)
    return result !== null
  }, [])

  const getJobApplicantList = useCallback((jobId: string) => {
    return handleAsync(`${jobId}_applicants`, () => getJobApplicants(jobId), [])
  }, [])

  return {
    // Data fetching
    getAllJobs,
    getJob,
    getJobApplicantList,

    // CRUD operations
    createNewJob,
    updateExistingJob,
    deleteExistingJob,

    // State helpers
    isJobLoading: (key: string) => loading[key] || false,
    getJobError: (key: string) => errors[key] || null,
    isActionLoading: (key: string) => loading[key] || false,
    getActionError: (key: string) => errors[key] || null,
  }
}
