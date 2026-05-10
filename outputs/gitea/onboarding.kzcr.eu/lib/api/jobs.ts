import { api } from '../api'

export interface Job {
  id: string
  title: string
  description?: string
  short_description?: string
  job_role_id?: string
  job_role_name?: string
  organization_id: string
  organization_name?: string
  status: string
  salary_min?: number
  salary_max?: number
  department?: string
  contract_type_code?: string[]
  contract_type_label?: string
  contract_type_labels?: string[]
  publish_date?: string
  expire_date?: string
  contact_email?: string
  contact_phone?: string
  cv_required?: boolean
  is_department_accredited?: boolean
  created_by?: string
  created_by_name?: string
  created_by_surname?: string
  created_by_email?: string
  authorized_people?: AuthorizedPerson[]
  sections?: {
    [key: string]: string[]
  }
}

export interface AuthorizedPerson {
  assignmentId?: string
  assignedAt?: string
  localUserId?: string
  userId?: string
  id?: string | null
  name?: string | null
  surname?: string | null
  fullName?: string | null
  email: string
  seatLocation: string
  organizationId?: string | null
  organizationName?: string | null
  existsLocally?: boolean
}

export interface JobApplicantSummary {
  id: string
  name: string
  surname: string
  email: string
  phone: string
  current_status?: string
  applied_at: string
  created_at?: string
  updated_at?: string
  cv_analysis_status?: 'pending' | 'processing' | 'completed' | 'failed' | null
  cv_analysis_score?: number | null
  cv_analysis_processed_at?: string | null
}

export interface JobFormData {
  title: string
  description: string
  organization_id: string
  job_role_id: string
  contract_type_codes: string[]
  department: string
  salary_min: string
  salary_max: string
  publish_date: string
  expire_date: string
  contact_email: string
  contact_phone: string
  cv_required: boolean
  is_department_accredited: boolean
  status: 'draft' | 'active' | 'end'
  sections: {
    duties: string[]
    requirements: string[]
    benefits: string[]
  }
}


export interface JobsQuery {
  page?: number
  org?: string
  role?: string
  classification?: string
  roles?: string[]
  contractType?: string
  contractTypes?: string[]
  q?: string
  salaryMin?: number
  salaryMax?: number
  status?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface JobsResponse {
  data: Job[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

// Get all jobs with pagination and filtering
export const getAllJobsAdmin = async (query: JobsQuery = {}): Promise<JobsResponse> => {
  const params = new URLSearchParams()

  if (query.page !== undefined) params.append('page', query.page.toString())
  if (query.org) params.append('org', query.org)
  if (query.role) params.append('role', query.role)
  if (query.classification) params.append('classification', query.classification)
  if (query.roles) params.append('roles', query.roles.join(','))
  if (query.contractType) params.append('contractType', query.contractType)
  if (query.contractTypes) params.append('contractTypes', query.contractTypes.join(','))
  if (query.q) params.append('q', query.q)
  if (query.salaryMin) params.append('salaryMin', query.salaryMin.toString())
  if (query.salaryMax) params.append('salaryMax', query.salaryMax.toString())
  if (query.status) params.append('status', query.status)
  if (query.sortBy) params.append('sortBy', query.sortBy)
  if (query.sortOrder) params.append('sortOrder', query.sortOrder)

  const queryString = params.toString()
  const url = queryString ? `/admin/jobs/?${queryString}` : '/admin/jobs'

  return api<JobsResponse>(url)
}

// Get job by ID
export const getJobById = async (id: string): Promise<Job> => {
  return api<Job>(`/admin/jobs/${id}`)
}

// Create new job
export const createJob = async (jobData: Partial<Job>): Promise<Job> => {
  return api<Job>('/admin/jobs', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(jobData),
  })
}

// Update job
export const updateJob = async (id: string, jobData: Partial<Job>): Promise<Job> => {
  return api<Job>(`/admin/jobs/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(jobData),
  })
}

// Update job status
export const updateJobStatus = async (id: string, status: 'draft' | 'active' | 'end' | 'archived'): Promise<Job> => {
  return api<Job>(`/admin/jobs/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ status }),
  })
}

// Duplicate job
export const duplicateJob = async (id: string): Promise<Job> => {
  return api<Job>(`/admin/jobs/${id}/duplicate`, {
    method: 'POST',
  })
}

// Delete job
export const deleteJob = async (id: string): Promise<void> => {
  return api<void>(`/admin/jobs/${id}`, {
    method: 'DELETE',
  })
}

// Get job detail for admin
export const getJobDetailAdmin = async (id: string): Promise<Job> => {
  return api<Job>(`/admin/jobs/${id}`)
}

export const searchInternalUsers = async (query: string): Promise<AuthorizedPerson[]> => {
  const params = new URLSearchParams({
    q: query,
  })

  return api<AuthorizedPerson[]>(`/admin/internal-users/search?${params.toString()}`)
}

export const updateJobAuthorizedPeople = async (jobId: string, authorizedPeople: AuthorizedPerson[]): Promise<{
  authorized_people: AuthorizedPerson[]
}> => {
  return api<{ authorized_people: AuthorizedPerson[] }>(`/admin/jobs/${jobId}/authorized-people`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ authorizedPeople }),
  })
}

// Get job applicants  
export const getJobApplicants = async (jobId: string): Promise<JobApplicantSummary[]> => {
  return api<JobApplicantSummary[]>(`/admin/jobs/${jobId}/applicants`)
}

// Update applicant status
export const updateApplicantStatus = async (jobId: string, applicantId: string, statusName: string, notes?: string): Promise<unknown> => {
  return api<unknown>(`/admin/jobs/${jobId}/applicants/${applicantId}/status`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ statusName, notes }),
  })
}

// Send email to applicant
export const sendEmailToApplicant = async (jobId: string, applicantId: string, emailType: string, customMessage?: string): Promise<unknown> => {
  return api<unknown>(`/admin/jobs/${jobId}/applicants/${applicantId}/send-email`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ emailType, customMessage }),
  })
}

// Job Posting Statuses
export interface JobPostingStatus {
  code: string
  label: string
  description?: string
}

// Get all job posting statuses
export const getAllJobPostingStatuses = async (): Promise<JobPostingStatus[]> => {
  return api<JobPostingStatus[]>('/job_posting_statuses')
}

// Get job posting status by code
export const getJobPostingStatusByCode = async (code: string): Promise<JobPostingStatus> => {
  return api<JobPostingStatus>(`/job_posting_statuses/${code}`)
}

// AI-powered job seeker matching
export interface MatchingJobSeeker {
  job_seeker_id: string
  first_name: string
  last_name: string
  email: string
  phone: string
  organization_ids: string[]
  organization_names: string[]
  similarity_score: number
  skills: string[]
  summary: string | null
  cv_file_path: string | null
  submitted_at: string
}

export interface MatchingJobSeekersResponse {
  job_id: string
  job_title: string
  status: 'pending' | 'processing' | 'completed'
  message?: string
  cached?: boolean
  count?: number
  matches?: MatchingJobSeeker[]
}

/**
 * Get matching job seekers for a job posting using AI embedding similarity
 * Returns 200 with matches if embedding is ready, or 202 if embedding is being generated
 */
export const getMatchingJobSeekers = async (
  jobId: string,
  options: { limit?: number; threshold?: number } = {}
): Promise<MatchingJobSeekersResponse> => {
  return api<MatchingJobSeekersResponse>(`/admin/jobs/${jobId}/matching-job-seekers`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      limit: options.limit || 20,
      threshold: options.threshold || 0.5,
    }),
  })
}

/**
 * Get job embedding status (for polling)
 */
export const getJobEmbeddingStatus = async (jobId: string): Promise<{
  job_id: string
  status: 'not_started' | 'pending' | 'processing' | 'completed' | 'failed'
  message?: string
  error_message?: string | null
  created_at?: string
  processed_at?: string
}> => {
  return api(`/admin/jobs/${jobId}/embedding-status`)
}
