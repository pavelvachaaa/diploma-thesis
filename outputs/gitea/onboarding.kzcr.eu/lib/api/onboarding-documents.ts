import { api } from '../api'

export interface OnboardingDocument {
  id: string
  name: string
  description?: string
  type_id?: string
  type_name?: string
  organization_id?: string
  organization_name?: string
  required: boolean
  file_name?: string
  file_path?: string
  mime_type?: string
  file_size?: number
  uploaded_at?: string
  is_template?: boolean
  status?: 'draft' | 'active' | 'archived'
  applies_to_all_organizations?: boolean
}

export interface OnboardingDocumentsResponse {
  data: OnboardingDocument[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface OnboardingDocumentsQuery {
  page?: number
  limit?: number
  q?: string
  org?: string
  type?: string
  required?: boolean
}

export interface JobRoleDocumentAssignment {
  id: string
  job_role_id: string
  document_id: string
  is_mandatory: boolean
}

// Get all onboarding documents with pagination (for admin)
export const getAllOnboardingDocumentsAdmin = async (query: OnboardingDocumentsQuery = {}): Promise<OnboardingDocumentsResponse> => {
  const params = new URLSearchParams()
  if (query.page !== undefined) params.append('page', query.page.toString())
  if (query.limit !== undefined) params.append('limit', query.limit.toString())
  if (query.q) params.append('q', query.q)
  if (query.org) params.append('org', query.org)
  if (query.type) params.append('type', query.type)
  if (query.required !== undefined) params.append('required', query.required.toString())
  
  const url = `/admin/onboarding-documents${params.toString() ? `?${params.toString()}` : ''}`
  return api<OnboardingDocumentsResponse>(url)
}

// Get onboarding documents by organization
export const getOnboardingDocumentsByOrganization = async (organizationId: string): Promise<OnboardingDocument[]> => {
  return api<OnboardingDocument[]>(`/admin/onboarding-documents/organization/${organizationId}`)
}

// Get onboarding document by ID
export const getOnboardingDocumentById = async (id: string): Promise<OnboardingDocument> => {
  return api<OnboardingDocument>(`/admin/onboarding-documents/${id}`)
}

// Create new onboarding document with file upload
export const createOnboardingDocument = async (formData: FormData): Promise<OnboardingDocument> => {
  const BASE_URL = process.env.NODE_ENV === "production" 
    ? (process.env.NEXT_PUBLIC_BASE_API_URL_PROD || 'https://kz-iristst.kzcr.eu/hrbackend/api/v1')
    : (process.env.NEXT_PUBLIC_BASE_API_URL_DEV || 'http://localhost:3322/api/v1');
  
  const response = await fetch(`${BASE_URL}/admin/onboarding-documents`, {
    method: 'POST',
    credentials: 'include',
    body: formData, // Don't set Content-Type, let browser set it for multipart/form-data
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || 'Chyba při vytváření dokumentu')
  }

  return response.json()
}

// Create onboarding document without file (legacy)
export const createOnboardingDocumentLegacy = async (documentData: Partial<OnboardingDocument>): Promise<OnboardingDocument> => {
  return api<OnboardingDocument>('/admin/onboarding-documents', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(documentData),
  })
}

// Update onboarding document
export const updateOnboardingDocument = async (id: string, documentData: Partial<OnboardingDocument>): Promise<OnboardingDocument> => {
  return api<OnboardingDocument>(`/admin/onboarding-documents/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(documentData),
  })
}

// Delete onboarding document
export const deleteOnboardingDocument = async (id: string): Promise<void> => {
  return api<void>(`/admin/onboarding-documents/${id}`, {
    method: 'DELETE',
  })
}

// Get documents assigned to a job role
export const getDocumentsByJobRole = async (jobRoleId: string): Promise<OnboardingDocument[]> => {
  return api<OnboardingDocument[]>(`/admin/onboarding-documents/job-role/${jobRoleId}`)
}

// Assign document to job role
export const assignDocumentToJobRole = async (jobRoleId: string, documentId: string, isMandatory: boolean = true): Promise<JobRoleDocumentAssignment> => {
  return api<JobRoleDocumentAssignment>(`/admin/onboarding-documents/job-role/${jobRoleId}/assign`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ documentId, isMandatory }),
  })
}

// Update job role document assignment
export const updateJobRoleDocumentAssignment = async (jobRoleId: string, documentId: string, isMandatory: boolean): Promise<JobRoleDocumentAssignment> => {
  return api<JobRoleDocumentAssignment>(`/admin/onboarding-documents/job-role/${jobRoleId}/documents/${documentId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ isMandatory }),
  })
}

// Remove document from job role
export const removeDocumentFromJobRole = async (jobRoleId: string, documentId: string): Promise<void> => {
  return api<void>(`/admin/onboarding-documents/job-role/${jobRoleId}/documents/${documentId}`, {
    method: 'DELETE',
  })
}

// Download document file
export const downloadDocumentFile = async (documentId: string, fileName: string): Promise<void> => {
  const BASE_URL = process.env.NODE_ENV === "production" 
    ? (process.env.NEXT_PUBLIC_BASE_API_URL_PROD || 'https://kz-iristst.kzcr.eu/hrbackend/api/v1')
    : (process.env.NEXT_PUBLIC_BASE_API_URL_DEV || 'http://localhost:3322/api/v1');
  
  const response = await fetch(`${BASE_URL}/admin/onboarding-documents/${documentId}/download`, {
    method: 'GET',
    credentials: 'include',
  })

  if (!response.ok) {
    throw new Error('Chyba při stahování souboru')
  }

  // Create blob from response
  const blob = await response.blob()
  const url = window.URL.createObjectURL(blob)
  
  // Create temporary link and trigger download
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  
  // Cleanup
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}

// Workflow document management functions

// Get documents attached to a workflow
export const getWorkflowDocuments = async (workflowId: string): Promise<OnboardingDocument[]> => {
  return api<OnboardingDocument[]>(`/admin/onboarding-documents/workflows/${workflowId}/documents`)
}

// Attach document to workflow
export interface WorkflowDocumentAttachment {
  document_id: string
  is_mandatory: boolean
}

export const attachDocumentToWorkflow = async (workflowId: string, attachment: WorkflowDocumentAttachment): Promise<any> => {
  return api<any>(`/admin/onboarding-documents/workflows/${workflowId}/documents`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(attachment),
  })
}

// Update workflow document attachment
export const updateWorkflowDocumentAttachment = async (workflowId: string, documentId: string, isMandatory: boolean): Promise<any> => {
  return api<any>(`/admin/onboarding-documents/workflows/${workflowId}/documents/${documentId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ is_mandatory: isMandatory }),
  })
}

// Remove document from workflow
export const removeDocumentFromWorkflow = async (workflowId: string, documentId: string): Promise<void> => {
  return api<void>(`/admin/onboarding-documents/workflows/${workflowId}/documents/${documentId}`, {
    method: 'DELETE',
  })
}

// Create document template
export const createDocumentTemplate = async (templateData: {
  name: string
  description?: string
  type_id?: string
  organization_id?: string
  applies_to_all_organizations?: boolean
}): Promise<OnboardingDocument> => {
  return api<OnboardingDocument>('/admin/onboarding-documents/templates', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(templateData),
  })
}

export const createDocumentTemplateWithFile = async (templateData: {
  name: string
  description?: string
  type_id?: string
  organization_id?: string
  applies_to_all_organizations?: boolean
}, file?: File): Promise<OnboardingDocument> => {
  const formData = new FormData()
  
  // Add template data
  formData.append('name', templateData.name)
  if (templateData.description) formData.append('description', templateData.description)
  if (templateData.type_id) formData.append('type_id', templateData.type_id)
  if (templateData.organization_id) formData.append('organization_id', templateData.organization_id)
  if (templateData.applies_to_all_organizations !== undefined) {
    formData.append('applies_to_all_organizations', templateData.applies_to_all_organizations.toString())
  }
  
  // Add file if provided
  if (file) {
    formData.append('file', file)
  }
  
  return api<OnboardingDocument>('/admin/onboarding-documents', {
    method: 'POST',
    body: formData,
  })
}

// Upload file to template
export const uploadTemplateFile = async (templateId: string, formData: FormData): Promise<OnboardingDocument> => {
  const BASE_URL = process.env.NODE_ENV === "production" 
    ? (process.env.NEXT_PUBLIC_BASE_API_URL_PROD || 'https://kz-iristst.kzcr.eu/hrbackend/api/v1')
    : (process.env.NEXT_PUBLIC_BASE_API_URL_DEV || 'http://localhost:3322/api/v1');
  
  const response = await fetch(`${BASE_URL}/admin/onboarding-documents/${templateId}/file`, {
    method: 'PUT',
    credentials: 'include',
    body: formData,
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || 'Chyba při nahrávání souboru')
  }

  return response.json()
}

// Step document management functions

// Get documents attached to a step
export const getStepDocuments = async (stepId: string): Promise<OnboardingDocument[]> => {
  return api<OnboardingDocument[]>(`/admin/onboarding-documents/steps/${stepId}/documents`)
}

// Attach document to step
export const attachDocumentToStep = async (stepId: string, attachment: WorkflowDocumentAttachment): Promise<any> => {
  return api<any>(`/admin/onboarding-documents/steps/${stepId}/documents`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(attachment),
  })
}

// Remove document from step
export const removeDocumentFromStep = async (stepId: string, documentId: string): Promise<void> => {
  return api<void>(`/admin/onboarding-documents/steps/${stepId}/documents/${documentId}`, {
    method: 'DELETE',
  })
}