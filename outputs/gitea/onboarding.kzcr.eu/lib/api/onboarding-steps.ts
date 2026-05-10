import { api, downloadFile } from '../api'
import type {
  StepDetails,
  StepActionResponse,
  AcknowledgeRequest,
  FormSubmissionRequest,
  MarkDocumentReadRequest,
  ApiError
} from '../types/onboarding-steps'

/**
 * Get step details with form, documents, and user progress
 */
export const getStepDetails = async (stepId: string): Promise<StepDetails> => {
  return api<StepDetails>(`/onboarding/steps/${stepId}`)
}

/**
 * Start a step - set status to in_progress
 */
export const startStep = async (stepId: string): Promise<StepActionResponse> => {
  return api<StepActionResponse>(`/onboarding/steps/${stepId}/start`, {
    method: 'POST'
  })
}

/**
 * Acknowledge a step
 */
export const acknowledgeStep = async (
  stepId: string, 
  request: AcknowledgeRequest
): Promise<StepActionResponse> => {
  return api<StepActionResponse>(`/onboarding/steps/${stepId}/ack`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  })
}

/**
 * Submit form answers
 */
export const submitForm = async (
  stepId: string, 
  request: FormSubmissionRequest
): Promise<StepActionResponse> => {
  return api<StepActionResponse>(`/onboarding/steps/${stepId}/form`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  })
}

/**
 * Mark document as read
 */
export const markDocumentRead = async (
  stepId: string, 
  request: MarkDocumentReadRequest
): Promise<StepActionResponse> => {
  return api<StepActionResponse>(`/onboarding/steps/${stepId}/read-document`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  })
}

/**
 * Complete a step
 */
export const completeStep = async (stepId: string): Promise<StepActionResponse> => {
  return api<StepActionResponse>(`/onboarding/steps/${stepId}/complete`, {
    method: 'POST'
  })
}

/**
 * Skip a step
 */
export const skipStep = async (stepId: string): Promise<StepActionResponse> => {
  return api<StepActionResponse>(`/onboarding/steps/${stepId}/skip`, {
    method: 'POST'
  })
}

/**
 * Download document attached to a step
 */
export const downloadStepDocument = async (
  documentId: string, 
  filename: string
): Promise<void> => {
  return downloadFile(`/onboarding/steps/documents/${documentId}/download`, filename)
}

// Convenience functions

/**
 * Approve/acknowledge a step (convenience method)
 */
export const approveStep = async (stepId: string): Promise<StepActionResponse> => {
  return acknowledgeStep(stepId, { acknowledged: true })
}

/**
 * Reject/unacknowledge a step (convenience method)
 */
export const rejectStep = async (stepId: string): Promise<StepActionResponse> => {
  return acknowledgeStep(stepId, { acknowledged: false })
}

/**
 * Check if user can complete a step based on requirements
 */
export const checkCompletionRequirements = (stepDetails: StepDetails) => {
  const { step, userStep, documents } = stepDetails
  
  const requirements = {
    needsAcknowledgment: false,
    missingFormFields: [] as string[],
    unreadMandatoryDocs: [] as string[],
    canComplete: true
  }

  // Check acknowledgment requirement
  if ((step.step_type === 'ack' || step.acknowledgment_text) && !userStep.acknowledged) {
    requirements.needsAcknowledgment = true
    requirements.canComplete = false
  }

  // Check form requirements (if it's a form step)
  if (step.step_type === 'form' && stepDetails.form) {
    const requiredFields = stepDetails.form.fields.filter(field => field.is_required)
    const answers = userStep.form_response || {}
    
    for (const field of requiredFields) {
      if (!answers[field.id] || answers[field.id] === '') {
        requirements.missingFormFields.push(field.id)
        requirements.canComplete = false
      }
    }
  }

  // Check mandatory document reads
  const mandatoryDocs = documents.filter(doc => doc.is_mandatory)
  const docReads = userStep.form_response?.docReads || {}
  
  for (const doc of mandatoryDocs) {
    if (!docReads[doc.document_id]) {
      requirements.unreadMandatoryDocs.push(doc.document_id)
      requirements.canComplete = false
    }
  }

  return requirements
}

/**
 * Get document read status for UI display
 */
export const getDocumentReadStatuses = (stepDetails: StepDetails) => {
  const { documents, userStep } = stepDetails
  const docReads = userStep.form_response?.docReads || {}
  
  return documents.map(doc => ({
    documentId: doc.document_id,
    readAt: docReads[doc.document_id] || null,
    isRead: !!docReads[doc.document_id],
    isMandatory: doc.is_mandatory
  }))
}

/**
 * Error handler for step operations
 */
export const handleStepError = (error: any): string => {
  if (error?.details?.code === 'STATE_ERROR') {
    const { details } = error.details
    
    if (details.missing_acknowledgment) {
      return 'Step must be acknowledged before completion'
    }
    
    if (details.missing_form_fields?.length > 0) {
      const fieldLabels = details.missing_form_fields.map((f: any) => f.label).join(', ')
      return `Please complete required fields: ${fieldLabels}`
    }
    
    if (details.missing_docs?.length > 0) {
      const docNames = details.missing_docs.map((d: any) => d.name).join(', ')
      return `Please read mandatory documents: ${docNames}`
    }
  }
  
  return error?.message || error?.error || 'An unexpected error occurred'
}