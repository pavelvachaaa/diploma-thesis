import { api } from '../api'

export interface JobRoleClassification {
  code: string
  label: string
  description?: string
}

export interface JobRole {
  id: string
  name: string
  description?: string
  organization_id: string
  organization_name?: string
  classification_code?: string
  classification_label?: string
  created_at?: string
  updated_at?: string
}

export interface JobRolesResponse {
  data: JobRole[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface JobRolesQuery {
  page?: number
  limit?: number
  q?: string
  org?: string
  classification?: string
}

// Get all job roles
export const getAllJobRoles = async (): Promise<JobRole[]> => {
  return api<JobRole[]>('/job_roles')
}

// Get all job roles with pagination (for admin)
export const getAllJobRolesAdmin = async (query: JobRolesQuery = {}): Promise<JobRolesResponse> => {
  const params = new URLSearchParams()
  if (query.page !== undefined) params.append('page', query.page.toString())
  if (query.limit !== undefined) params.append('limit', query.limit.toString())
  if (query.q) params.append('q', query.q)
  if (query.org) params.append('org', query.org)
  if (query.classification) params.append('classification', query.classification)

  const url = `/admin/job_roles${params.toString() ? `?${params.toString()}` : ''}`
  return api<JobRolesResponse>(url)
}

// Get job roles by organization
export const getJobRolesByOrganization = async (organizationId: string): Promise<JobRole[]> => {
  return api<JobRole[]>(`/job_roles/organization/${organizationId}`)
}

// Get job role by ID
export const getJobRoleById = async (id: string): Promise<JobRole> => {
  return api<JobRole>(`/job_roles/${id}`)
}

// Create new job role
export const createJobRole = async (jobRoleData: Partial<JobRole>): Promise<JobRole> => {
  return api<JobRole>('/admin/job_roles', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(jobRoleData),
  })
}

// Update job role
export const updateJobRole = async (id: string, jobRoleData: Partial<JobRole>): Promise<JobRole> => {
  return api<JobRole>(`/admin/job_roles/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(jobRoleData),
  })
}

// Delete job role
export const deleteJobRole = async (id: string): Promise<void> => {
  return api<void>(`/admin/job_roles/${id}`, {
    method: 'DELETE',
  })
}

// Get all job role classifications
export const getAllClassifications = async (): Promise<JobRoleClassification[]> => {
  return api<JobRoleClassification[]>('/admin/job_roles/classifications')
}

export interface JobRoleSectionItem {
  job_role_section_item_id: string
  section_type_name: string
  section_item_id: string | null
  custom_text: string | null
  order_index: number
  item_text: string | null
  section_item_is_active: boolean | null
}

// Get job role section items (duties, requirements, benefits)
export const getJobRoleSectionItems = async (jobRoleId: string): Promise<JobRoleSectionItem[]> => {
  return api<JobRoleSectionItem[]>(`/admin/job_roles/${jobRoleId}/section-items`)
}