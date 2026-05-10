// Onboarding Steps Types

export interface OnboardingStep {
  id: string
  title: string
  description: string | null
  step_type: 'info' | 'ack' | 'form' | 'quiz' | 'file'
  acknowledgment_text: string | null
  is_mandatory: boolean
  order_index: number
  days_from_start: number
  duration_days: number
  instructions: string | null
  metadata: Record<string, any>
}

export interface StepFormField {
  id: string
  label: string
  field_type: 'text' | 'textarea' | 'select' | 'checkbox' | 'radio'
  is_required: boolean
  options: string[] | null
  order_index: number
}

export interface StepForm {
  id: string | null
  title: string | null
  description: string | null
  fields: StepFormField[]
}

export interface StepDocument {
  document_id: string
  name: string
  description: string | null
  is_mandatory: boolean
  file_path: string | null
  file_name: string | null
  mime_type: string | null
  download_url: string | null
}

export interface UserStep {
  id: string
  status: 'not_started' | 'in_progress' | 'completed' | 'skipped'
  acknowledged: boolean
  form_response: {
    docReads?: Record<string, string>
    [fieldId: string]: any
  }
  quiz_score: number | null
  passed: boolean | null
  completed_at: string | null
}

export interface StepDetails {
  step: OnboardingStep
  form: StepForm | null
  documents: StepDocument[]
  userStep: UserStep
}

// API Request/Response Types

export interface AcknowledgeRequest {
  acknowledged: boolean
}

export interface FormSubmissionRequest {
  answers: Record<string, any>
}

export interface MarkDocumentReadRequest {
  document_id: string
}

export interface StepActionResponse {
  userStep: Pick<UserStep, 'id' | 'status' | 'acknowledged' | 'form_response' | 'completed_at'>
}

// Error Types

export interface ValidationError {
  field: string
  message: string
}

export interface StateError {
  code: 'STATE_ERROR'
  details: {
    missing_acknowledgment?: boolean
    missing_form_fields?: Array<{
      field_id: string
      label: string
    }>
    missing_docs?: Array<{
      document_id: string
      name: string
    }>
  }
}

export interface ApiError {
  error: string
  details?: ValidationError[] | StateError['details']
}

// Form Field Value Types

export type FieldValue = string | boolean | string[] | number

export interface FormValues {
  [fieldId: string]: FieldValue
}

// Component Props Types

export interface StepHeaderProps {
  step: OnboardingStep
  userStep: UserStep
}

export interface DocumentListProps {
  documents: StepDocument[]
  userStep: UserStep
  onMarkAsRead: (documentId: string) => Promise<void>
}

export interface AcknowledgeCardProps {
  step: OnboardingStep
  userStep: UserStep
  onAcknowledge: (acknowledged: boolean) => Promise<void>
}

export interface DynamicFormProps {
  form: StepForm
  userStep: UserStep
  onSubmit: (answers: Record<string, any>) => Promise<void>
}

export interface StepActionsProps {
  step: OnboardingStep
  userStep: UserStep
  documents: StepDocument[]
  isFormValid?: boolean
  onStart: () => Promise<void>
  onComplete: () => Promise<void>
  onSkip: () => Promise<void>
}

// Helper Types

export interface DocumentReadStatus {
  documentId: string
  readAt: string | null
  isRead: boolean
  isMandatory: boolean
}

export interface CompletionRequirements {
  needsAcknowledgment: boolean
  missingFormFields: string[]
  unreadMandatoryDocs: string[]
  canComplete: boolean
}