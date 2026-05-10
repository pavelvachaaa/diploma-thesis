import { api } from '../api'

export interface Organization {
  id: string
  name: string
  seat_location?: string | null
  address?: string | null
  contact_email?: string | null
  contact_name?: string | null
  contact_phone?: string | null
  contact_linkedin_url?: string | null
  contact_photo_file_id?: string | null
  contact_photo_url?: string | null
}

export interface OrganizationsResponse {
  data: Organization[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

export interface GetOrganizationsParams {
  page?: number
  limit?: number
  search?: string
}

// Get all organizations (scoped by user's organization for non-super-admins)
export const getAllOrganizations = async (params?: GetOrganizationsParams): Promise<OrganizationsResponse> => {
  const queryParams = new URLSearchParams()
  if (params?.page !== undefined) queryParams.append('page', params.page.toString())
  if (params?.limit !== undefined) queryParams.append('limit', params.limit.toString())
  if (params?.search) queryParams.append('search', params.search)

  const queryString = queryParams.toString()
  const url = `/admin/organizations${queryString ? `?${queryString}` : ''}`

  return api<OrganizationsResponse>(url)
}

// Get organization by ID
export const getOrganizationById = async (id: string): Promise<Organization> => {
  return api<Organization>(`/admin/organizations/${id}`)
}

// Create new organization
export const createOrganization = async (organizationData: Partial<Organization>): Promise<Organization> => {
  return api<Organization>('/admin/organizations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(organizationData),
  })
}

// Update organization
export const updateOrganization = async (id: string, organizationData: Partial<Organization>): Promise<Organization> => {
  return api<Organization>(`/admin/organizations/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(organizationData),
  })
}

// Delete organization
export const deleteOrganization = async (id: string): Promise<void> => {
  return api<void>(`/admin/organizations/${id}`, {
    method: 'DELETE',
  })
}

export const uploadOrganizationContactPhoto = async (id: string, formData: FormData): Promise<Organization> => {
  return api<Organization>(`/admin/organizations/${id}/contact-photo`, {
    method: 'PUT',
    body: formData,
  })
}

export const deleteOrganizationContactPhoto = async (id: string): Promise<Organization> => {
  return api<Organization>(`/admin/organizations/${id}/contact-photo`, {
    method: 'DELETE',
  })
}
