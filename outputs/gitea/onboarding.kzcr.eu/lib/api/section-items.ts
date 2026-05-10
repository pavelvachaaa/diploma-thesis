import { api } from '../api'

export interface SectionType {
  name: string
  description?: string
}

export interface SectionItem {
  id: string
  section_type_name: string
  item_text: string
  is_active: boolean
  created_at: string
  order_index: number
  section_type_description?: string
}

export interface SectionItemsResponse {
  data: SectionItem[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface SectionItemsQuery {
  page?: number
  limit?: number
  q?: string
  sectionType?: string
  activeOnly?: boolean
}

export interface SectionTypeLookupQuery {
  activeOnly?: boolean
  q?: string
  limit?: number
}

export interface JobRoleSectionItem {
  job_role_section_item_id: string
  section_type_name: string
  section_item_id?: string
  custom_text?: string
  order_index: number
  item_text?: string
  section_item_is_active?: boolean
}

// Get all section types
export const getAllSectionTypes = async (): Promise<SectionType[]> => {
  return api<SectionType[]>('/admin/section-items/section-types')
}

// Get all section items with pagination
export const getAllSectionItems = async (query: SectionItemsQuery = {}): Promise<SectionItemsResponse> => {
  const params = new URLSearchParams()
  if (query.page !== undefined) params.append('page', query.page.toString())
  if (query.limit !== undefined) params.append('limit', query.limit.toString())
  if (query.q) params.append('q', query.q)
  if (query.sectionType) params.append('sectionType', query.sectionType)
  if (query.activeOnly !== undefined) params.append('activeOnly', query.activeOnly.toString())

  const url = `/admin/section-items${params.toString() ? `?${params.toString()}` : ''}`
  return api<SectionItemsResponse>(url)
}

// Get section items by section type
export const getSectionItemsBySectionType = async (
  sectionType: string,
  options: boolean | SectionTypeLookupQuery = true
): Promise<SectionItem[]> => {
  const resolvedOptions = typeof options === 'boolean'
    ? { activeOnly: options }
    : options
  const params = new URLSearchParams()
  params.append('activeOnly', String(resolvedOptions.activeOnly !== false))
  if (resolvedOptions.q) params.append('q', resolvedOptions.q)
  if (resolvedOptions.limit !== undefined) params.append('limit', resolvedOptions.limit.toString())
  return api<SectionItem[]>(`/admin/section-items/by-section-type/${sectionType}?${params.toString()}`)
}

// Get section item by ID
export const getSectionItemById = async (id: string): Promise<SectionItem> => {
  return api<SectionItem>(`/admin/section-items/${id}`)
}

// Create new section item
export const createSectionItem = async (sectionItemData: Partial<SectionItem>): Promise<SectionItem> => {
  return api<SectionItem>('/admin/section-items', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(sectionItemData),
  })
}

// Update section item
export const updateSectionItem = async (id: string, sectionItemData: Partial<SectionItem>): Promise<SectionItem> => {
  return api<SectionItem>(`/admin/section-items/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(sectionItemData),
  })
}

// Delete section item
export const deleteSectionItem = async (id: string): Promise<void> => {
  return api<void>(`/admin/section-items/${id}`, {
    method: 'DELETE',
  })
}

// Update order indices
export const updateSectionItemsOrder = async (items: { id: string; order_index: number }[]): Promise<void> => {
  return api<void>('/admin/section-items/reorder', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ items }),
  })
}

// ===== Job Role Section Items =====

// Get section items for a job role
export const getJobRoleSectionItems = async (jobRoleId: string): Promise<JobRoleSectionItem[]> => {
  return api<JobRoleSectionItem[]>(`/admin/job_roles/${jobRoleId}/section-items`)
}

// Add section item to job role
export const addSectionItemToJobRole = async (
  jobRoleId: string,
  data: {
    section_type_name: string
    section_item_id?: string
    custom_text?: string
    order_index?: number
  }
): Promise<JobRoleSectionItem> => {
  return api<JobRoleSectionItem>(`/admin/job_roles/${jobRoleId}/section-items`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
}

// Replace all section items for a specific section type in a job role
export const replaceJobRoleSectionItems = async (
  jobRoleId: string,
  sectionType: string,
  items: { section_item_id?: string; custom_text?: string }[]
): Promise<void> => {
  return api<void>(`/admin/job_roles/${jobRoleId}/section-items/${sectionType}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ items }),
  })
}

// Update job role section item
export const updateJobRoleSectionItem = async (
  id: string,
  data: {
    section_type_name: string
    section_item_id?: string
    custom_text?: string
    order_index: number
  }
): Promise<JobRoleSectionItem> => {
  return api<JobRoleSectionItem>(`/admin/job_roles/section-items/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
}

// Remove section item from job role
export const removeJobRoleSectionItem = async (id: string): Promise<void> => {
  return api<void>(`/admin/job_roles/section-items/${id}`, {
    method: 'DELETE',
  })
}
