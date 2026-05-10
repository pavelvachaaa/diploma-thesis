import { api, downloadFile } from '../api'

export interface OnboardingStep {
  user_step_id: string  // The user_onboarding_steps.id - this is what we navigate with
  id: string           // The onboarding_steps.id - the template step
  title: string
  description: string
  step_type: string
  status: 'not_started' | 'in_progress' | 'completed' | 'skipped'
  days_from_start: number
  duration_days: number
  is_mandatory: boolean
  instructions?: string
  completed_at?: string
}

export interface RequiredDocument {
  id: string
  name: string
  description: string
  document_type: string
  is_mandatory: boolean
  status: 'pending' | 'uploaded' | 'approved' | 'rejected'
  uploaded_at?: string
  filename?: string
  original_filename?: string
  mime_type?: string
  file_size?: number
  file_path?: string
  user_document_id?: string // Keep this for backward compatibility with existing data structures
  template_file?: string
  has_template: boolean
  reviewed_by?: string
  reviewed_at?: string
  review_notes?: string
}

export interface OnboardingUser {
  id: string
  name: string
  surname: string
  email: string
  organization_name: string
  workflow_name: string
  start_date: string
}

export interface OnboardingProgress {
  overall_progress: number
  steps: {
    completed: number
    total: number
  }
  documents: {
    uploaded: number
    total: number
  }
  document_progress: number
}

export interface OnboardingDashboard {
  user: OnboardingUser
  steps: OnboardingStep[]
  documents: RequiredDocument[]
  progress: OnboardingProgress
}

// Get employee onboarding dashboard data
export const getOnboardingDashboard = async (): Promise<OnboardingDashboard> => {
  return api<OnboardingDashboard>('/employee/onboarding/dashboard')
}

// Get onboarding steps for current user
export const getOnboardingSteps = async (): Promise<OnboardingStep[]> => {
  return api<OnboardingStep[]>('/employee/onboarding/steps')
}

// Start an onboarding step
export const startOnboardingStep = async (userStepId: string): Promise<void> => {
  return api<void>(`/employee/onboarding/steps/${userStepId}/start`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    }
  })
}

// Complete an onboarding step
export const completeOnboardingStep = async (userStepId: string): Promise<void> => {
  return api<void>(`/employee/onboarding/steps/${userStepId}/complete`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    }
  })
}

// Get required documents for current user
export const getRequiredDocuments = async (): Promise<RequiredDocument[]> => {
  return api<RequiredDocument[]>('/employee/onboarding/documents')
}

// Get a specific user document by ID
export const getUserDocument = async (userDocumentId: string): Promise<RequiredDocument> => {
  return api<RequiredDocument>(`/employee/onboarding/documents/${userDocumentId}`)
}

// Upload a document
export const uploadDocument = async (documentId: string, file: File): Promise<void> => {
  const formData = new FormData()
  formData.append('file', file)
  
  return api<void>(`/employee/onboarding/documents/${documentId}/upload`, {
    method: 'POST',
    body: formData,
    // Don't set Content-Type header - let browser set it for FormData
  })
}

// Download a document template
export const downloadDocumentTemplate = async (templateFile: string): Promise<void> => {
  return downloadFile(`/employee/onboarding/templates/${templateFile}`, templateFile)
}

// Download a document (uses original filename)
export const downloadDocument = async (userDocumentId: string): Promise<void> => {
  try {
    // Get document details to retrieve the original filename
    const document = await getUserDocument(userDocumentId)
    console.log(document);
    const filename = document.original_filename || document.name || 'document'
    return downloadFile(`/employee/onboarding/documents/${userDocumentId}/download`, filename)
  } catch {
    // Fallback to generic name if we can't get document details
  }
}

// Get onboarding progress
export const getOnboardingProgress = async (): Promise<OnboardingProgress> => {
  return api<OnboardingProgress>('/employee/onboarding/progress')
}

// === NEW ONBOARDING STEPS API ===

// Get step details with form, documents, and user progress
export const getStepDetails = async (userStepId: string) => {
  return api(`/employee/onboarding/steps/${userStepId}`)
}

// Acknowledge a step
export const acknowledgeStep = async (userStepId: string, acknowledged: boolean) => {
  return api(`/employee/onboarding/steps/${userStepId}/ack`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ acknowledged })
  })
}

// Submit form answers
export const submitStepForm = async (userStepId: string, answers: Record<string, any>) => {
  return api(`/employee/onboarding/steps/${userStepId}/form`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ answers })
  })
}

// Mark document as read
export const markDocumentRead = async (userStepId: string, documentId: string) => {
  return api(`/employee/onboarding/steps/${userStepId}/read-document`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ document_id: documentId })
  })
}

// Skip a step
export const skipStep = async (userStepId: string) => {
  return api(`/employee/onboarding/steps/${userStepId}/skip`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    }
  })
}

// Download onboarding document
export const downloadOnboardingDocument = async (documentId: string, filename: string): Promise<void> => {
  return downloadFile(`/employee/onboarding/steps/documents/${documentId}/download`, filename)
}