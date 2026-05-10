import { api, downloadFile } from '../api'

export interface OnboardingWorkflow {
  id: string
  name: string
  description?: string
  organization_id: string
  organization_name?: string
  is_template: boolean
  is_active: boolean
  created_by?: string
  created_by_email?: string
  created_at: string
  updated_at: string
}

export interface OnboardingStep {
  id: string
  title: string
  description?: string
  step_type: 'info' | 'ack' | 'form' | 'quiz' | 'file'
  content_url?: string
  acknowledgment_text?: string
  organization_id: string
  is_mandatory: boolean
  order_index: number
  workflow_order?: number // Order within a specific workflow
  days_from_start: number
  duration_days: number
  auto_assign: boolean
  instructions?: string
  metadata: any
  documents?: OnboardingStepDocument[]
}

export interface OnboardingStepDocument {
  id: string
  name: string
  is_mandatory: boolean
}

export interface WorkflowWithSteps extends OnboardingWorkflow {
  steps: OnboardingStep[]
}

export interface WorkflowsResponse {
  data: OnboardingWorkflow[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface WorkflowsQuery {
  page?: number
  limit?: number
  q?: string
  org?: string
  template?: boolean
}

export interface UserOnboardingProgress {
  id: string
  user_id: string
  workflow_id: string
  workflow_name: string
  workflow_description?: string
  start_date: string
  expected_completion_date?: string
  actual_completion_date?: string
  status: 'not_started' | 'in_progress' | 'completed' | 'overdue'
  notes?: string
  assigned_hr?: string
  created_at: string
  updated_at: string
}

// Workflows CRUD
export const getAllWorkflows = async (query: WorkflowsQuery = {}): Promise<WorkflowsResponse> => {
  const params = new URLSearchParams()

  // Add page parameter
  if (query.page !== undefined && typeof query.page === 'number') {
    params.append('page', query.page.toString())
  }

  // Add limit parameter  
  if (query.limit !== undefined && typeof query.limit === 'number') {
    params.append('limit', query.limit.toString())
  }

  // Add search query if valid
  if (query.q && typeof query.q === 'string' && query.q.trim() !== '') {
    params.append('q', query.q.trim())
  }

  // Add organization filter - only send valid UUIDs, skip 'all'
  if (query.org && typeof query.org === 'string' && query.org.trim() !== '') {
    const orgValue = query.org.trim()
    if (orgValue !== 'undefined' && orgValue !== 'null' && orgValue !== 'all') {
      params.append('org', orgValue)
    }
  }

  // Add template filter if specified
  if (query.template !== undefined && typeof query.template === 'boolean') {
    params.append('template', query.template.toString())
  }

  const url = `/admin/workflows${params.toString() ? `?${params.toString()}` : ''}`

  return api<WorkflowsResponse>(url)
}

export const getWorkflowById = async (id: string): Promise<OnboardingWorkflow> => {
  return api<OnboardingWorkflow>(`/admin/workflows/${id}`)
}

export const getWorkflowWithSteps = async (id: string): Promise<WorkflowWithSteps> => {
  return api<WorkflowWithSteps>(`/admin/workflows/${id}/full`)
}

export const createWorkflow = async (workflowData: Partial<OnboardingWorkflow>): Promise<OnboardingWorkflow> => {
  return api<OnboardingWorkflow>('/admin/workflows', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(workflowData),
  })
}

export const updateWorkflow = async (id: string, workflowData: Partial<OnboardingWorkflow>): Promise<OnboardingWorkflow> => {
  return api<OnboardingWorkflow>(`/admin/workflows/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(workflowData),
  })
}

export const deleteWorkflow = async (id: string): Promise<void> => {
  return api<void>(`/admin/workflows/${id}`, {
    method: 'DELETE',
  })
}

// Workflow Steps
export const getWorkflowSteps = async (workflowId: string): Promise<OnboardingStep[]> => {
  return api<OnboardingStep[]>(`/admin/workflows/${workflowId}/steps`)
}

export const addStepToWorkflow = async (workflowId: string, stepId: string, orderIndex: number): Promise<any> => {
  return api<any>(`/admin/workflows/${workflowId}/steps`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ stepId, orderIndex }),
  })
}

export const removeStepFromWorkflow = async (workflowId: string, stepId: string): Promise<void> => {
  return api<void>(`/admin/workflows/${workflowId}/steps/${stepId}`, {
    method: 'DELETE',
  })
}

export const updateStepOrder = async (workflowId: string, stepId: string, orderIndex: number): Promise<any> => {
  return api<any>(`/admin/workflows/${workflowId}/steps/${stepId}/order`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ orderIndex }),
  })
}

// Onboarding Steps Management
export const getAllSteps = async (organizationId: string): Promise<OnboardingStep[]> => {
  return api<OnboardingStep[]>(`/admin/workflows/organization/${organizationId}/steps`)
}

export const createStep = async (stepData: Partial<OnboardingStep>): Promise<OnboardingStep> => {
  return api<OnboardingStep>('/admin/workflows/steps', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(stepData),
  })
}

export const updateStep = async (id: string, stepData: Partial<OnboardingStep>): Promise<OnboardingStep> => {
  return api<OnboardingStep>(`/admin/workflows/steps/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(stepData),
  })
}

export const deleteStep = async (id: string): Promise<void> => {
  return api<void>(`/admin/workflows/steps/${id}`, {
    method: 'DELETE',
  })
}

// Templates
export const getWorkflowTemplates = async (organizationId?: string): Promise<OnboardingWorkflow[]> => {
  if (organizationId) {
    const response = await api<WorkflowsResponse>(`/admin/workflows/organization/${organizationId}/templates`)
    return response.data
  }
  // Get all templates if no organization specified
  const response = await getAllWorkflows({ template: true })
  return response.data
}

export const createFromTemplate = async (templateId: string, workflowData: Partial<OnboardingWorkflow>): Promise<OnboardingWorkflow> => {
  return api<OnboardingWorkflow>(`/admin/workflows/templates/${templateId}/copy`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(workflowData),
  })
}

// Job Role Assignment
export const getJobRoleWorkflows = async (jobRoleId: string): Promise<OnboardingWorkflow[]> => {
  return api<OnboardingWorkflow[]>(`/admin/workflows/job-role/${jobRoleId}/workflows`)
}

export const assignWorkflowToJobRole = async (jobRoleId: string, workflowId: string): Promise<any> => {
  return api<any>(`/admin/workflows/job-role/${jobRoleId}/assign`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ workflowId }),
  })
}

export const removeWorkflowFromJobRole = async (jobRoleId: string, workflowId: string): Promise<void> => {
  return api<void>(`/admin/workflows/job-role/${jobRoleId}/workflows/${workflowId}`, {
    method: 'DELETE',
  })
}

// User Progress
export const getUserOnboardingProgress = async (userId: string): Promise<UserOnboardingProgress[]> => {
  return api<UserOnboardingProgress[]>(`/admin/workflows/user/${userId}/progress`)
}

export const startUserOnboarding = async (data: {
  user_id: string
  workflow_id: string
  start_date: string
}): Promise<UserOnboardingProgress> => {
  return api<UserOnboardingProgress>('/admin/workflows/user/start-onboarding', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
}

// Document Management for Workflows
export interface WorkflowDocument {
  id: string // Association ID from workflow_documents table
  document_id: string // Actual document ID from onboarding_documents table
  name: string
  description?: string
  file_name?: string
  is_mandatory: boolean
  order_index: number
}

export const getWorkflowDocuments = async (workflowId: string): Promise<WorkflowDocument[]> => {
  return api<WorkflowDocument[]>(`/admin/onboarding-documents/workflows/${workflowId}/documents`)
}

export const attachDocumentToWorkflow = async (workflowId: string, documentId: string, isMandatory: boolean = false, orderIndex: number = 0): Promise<any> => {
  return api<any>(`/admin/onboarding-documents/workflows/${workflowId}/documents`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ document_id: documentId, is_mandatory: isMandatory, order_index: orderIndex }),
  })
}

export const removeDocumentFromWorkflow = async (workflowId: string, documentId: string): Promise<void> => {
  return api<void>(`/admin/onboarding-documents/workflows/${workflowId}/documents/${documentId}`, {
    method: 'DELETE',
  })
}

export const downloadWorkflowDocument = async (documentId: string, fileName: string): Promise<void> => {
  return downloadFile(`/admin/onboarding-documents/${documentId}/download`, fileName)
}