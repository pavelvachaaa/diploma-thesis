// Central TypeScript definitions for admin operations

// Base admin entities
export interface AdminEntity {
  id: string
  created_at: string
  updated_at: string
}

// Admin state management
export interface AdminEntityState<T = any> {
  data: T | null
  loading: boolean
  error: string | null
  lastFetched?: number
}

export interface AdminListState<T = any> {
  data: T[]
  loading: boolean
  error: string | null
  pagination?: PaginationState
  filters?: Record<string, any>
  search?: string
  lastFetched?: number
}

export interface PaginationState {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

// Admin operations
export interface AdminCRUDOperations<T, CreateData = Partial<T>, UpdateData = Partial<T>> {
  // Read operations
  getAll: (query?: any) => Promise<T[]>
  getById: (id: string) => Promise<T | null>
  
  // Write operations
  create: (data: CreateData) => Promise<T | null>
  update: (id: string, data: UpdateData) => Promise<boolean>
  delete: (id: string) => Promise<boolean>
  
  // Cache operations
  invalidate: (id?: string) => void
  refresh: (id?: string) => Promise<void>
}

// Employee admin types
export interface AdminEmployee extends AdminEntity {
  email: string
  name: string
  surname: string
  phone?: string
  is_active: boolean
  applicant_id?: string
  organization_id: string
  organization_name?: string
  role_name?: string
  role_description?: string
}

export interface AdminEmployeeFilters {
  search?: string
  role?: string
  organization?: string
  is_active?: boolean
  has_applicant?: boolean
}

export interface AdminEmployeeActions {
  activate: (id: string) => Promise<boolean>
  deactivate: (id: string) => Promise<boolean>
  resetPassword: (id: string) => Promise<string>
  assignRole: (id: string, roleId: string) => Promise<boolean>
  transferOrganization: (id: string, organizationId: string) => Promise<boolean>
}

// Applicant admin types
export interface AdminApplicant extends AdminEntity {
  email: string
  name: string
  surname: string
  phone?: string
  address?: string
  city?: string
  zip?: string
  education?: string
  experience?: string
  field?: string
  last_employer?: string
  last_position?: string
  job_posting_id: string
  job_title?: string
  current_status: string
  status_updated_at: string
  attachments?: AdminApplicantAttachment[]
  notes?: AdminApplicantNote[]
}

export interface AdminApplicantAttachment {
  id: string
  filename: string
  original_name: string
  file_size: number
  mime_type: string
  upload_date: string
  status: 'pending' | 'approved' | 'rejected' | 'needs_revision'
  review_notes?: string
  reviewed_by?: string
  reviewed_at?: string
}

export interface AdminApplicantNote {
  id: string
  note: string
  author_id: string
  author_name?: string
  created_at: string
}

export interface AdminApplicantFilters {
  search?: string
  job_id?: string
  status?: string[]
  education?: string[]
  experience?: string[]
  date_from?: string
  date_to?: string
  has_attachments?: boolean
}

export interface AdminApplicantActions {
  updateStatus: (id: string, status: string, notes?: string) => Promise<boolean>
  addNote: (id: string, note: string) => Promise<boolean>
  approveAttachment: (attachmentId: string, notes?: string) => Promise<boolean>
  rejectAttachment: (attachmentId: string, notes: string) => Promise<boolean>
  createEmployee: (id: string, workflowId: string) => Promise<AdminEmployee | null>
}

// Workflow admin types
export interface AdminWorkflow extends AdminEntity {
  name: string
  description?: string
  organization_id: string
  organization_name?: string
  is_template: boolean
  is_active: boolean
  created_by?: string
  created_by_email?: string
  steps?: AdminWorkflowStep[]
}

export interface AdminWorkflowStep {
  id: string
  title: string
  description?: string
  step_type: 'info' | 'ack' | 'form' | 'quiz'
  content_url?: string
  acknowledgment_text?: string
  organization_id: string
  is_mandatory: boolean
  order_index: number
  workflow_order?: number
  days_from_start: number
  duration_days: number
  auto_assign: boolean
  instructions?: string
  metadata: any
}

export interface AdminWorkflowFilters {
  search?: string
  organization?: string
  is_template?: boolean
  is_active?: boolean
  created_by?: string
}

export interface AdminWorkflowActions {
  duplicate: (id: string, name: string) => Promise<AdminWorkflow | null>
  createFromTemplate: (templateId: string, data: Partial<AdminWorkflow>) => Promise<AdminWorkflow | null>
  addStep: (workflowId: string, stepId: string, order: number) => Promise<boolean>
  removeStep: (workflowId: string, stepId: string) => Promise<boolean>
  reorderSteps: (workflowId: string, stepOrders: Array<{stepId: string, order: number}>) => Promise<boolean>
}

// Form admin types
export interface AdminForm extends AdminWorkflowStep {
  form_definition?: AdminFormDefinition
  responses?: AdminFormResponse[]
}

export interface AdminFormDefinition {
  title: string
  description?: string
  fields: AdminFormField[]
  validations?: Record<string, any>
  styling?: Record<string, any>
}

export interface AdminFormField {
  id: string
  type: 'text' | 'email' | 'number' | 'textarea' | 'select' | 'multiselect' | 'checkbox' | 'radio' | 'file' | 'date'
  label: string
  placeholder?: string
  required: boolean
  options?: Array<{value: string, label: string}>
  validation?: {
    min?: number
    max?: number
    pattern?: string
    message?: string
  }
  conditional?: {
    field: string
    value: any
    operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than'
  }
}

export interface AdminFormResponse {
  id: string
  employee_id: string
  employee_name?: string
  step_id: string
  responses: Record<string, any>
  submitted_at: string
  is_complete: boolean
  validation_errors?: Record<string, string>
}

export interface AdminFormFilters {
  search?: string
  step_type?: string[]
  organization?: string
  is_mandatory?: boolean
  has_responses?: boolean
}

export interface AdminFormActions {
  preview: (formDefinition: AdminFormDefinition) => void
  duplicate: (id: string, title: string) => Promise<AdminForm | null>
  exportResponses: (id: string, format: 'csv' | 'xlsx') => Promise<boolean>
  validateForm: (formDefinition: AdminFormDefinition) => { valid: boolean, errors: string[] }
}

// Onboarding progress admin types
export interface AdminOnboardingProgress {
  employee_id: string
  employee_name: string
  workflow_id: string
  workflow_name: string
  start_date: string
  expected_completion: string
  actual_completion?: string
  status: 'not_started' | 'in_progress' | 'completed' | 'overdue'
  progress_percentage: number
  completed_steps: number
  total_steps: number
  current_step?: AdminProgressStep
  overdue_steps: AdminProgressStep[]
  upcoming_steps: AdminProgressStep[]
}

export interface AdminProgressStep {
  id: string
  title: string
  step_type: string
  due_date: string
  completed_at?: string
  status: 'pending' | 'in_progress' | 'completed' | 'overdue' | 'skipped'
  form_responses?: Record<string, any>
}

export interface AdminOnboardingFilters {
  search?: string
  workflow?: string
  status?: string[]
  organization?: string
  overdue_only?: boolean
  date_range?: {from: string, to: string}
}

export interface AdminOnboardingActions {
  reassign: (employeeId: string, newWorkflowId: string) => Promise<boolean>
  extend: (employeeId: string, days: number) => Promise<boolean>
  complete: (employeeId: string, stepId: string) => Promise<boolean>
  skip: (employeeId: string, stepId: string, reason: string) => Promise<boolean>
  restart: (employeeId: string) => Promise<boolean>
}

// UI state types
export interface AdminUIState {
  selectedItems: Set<string>
  filters: Record<string, any>
  search: string
  sortConfig: {
    key: string
    direction: 'asc' | 'desc'
  } | null
  pagination: {
    page: number
    limit: number
  }
  viewMode: 'table' | 'grid' | 'list'
  sidebarCollapsed: boolean
}

// Action result types
export interface AdminActionResult<T = any> {
  success: boolean
  data?: T
  error?: string
  warnings?: string[]
}

export interface AdminBulkActionResult<T = any> {
  success: boolean
  successCount: number
  failureCount: number
  results: Array<AdminActionResult<T>>
  errors: string[]
}

// Analytics types
export interface AdminAnalytics {
  employees: {
    total: number
    active: number
    inactive: number
    by_organization: Record<string, number>
    by_role: Record<string, number>
  }
  applicants: {
    total: number
    by_status: Record<string, number>
    by_job: Record<string, number>
    conversion_rate: number
  }
  onboarding: {
    in_progress: number
    completed_this_month: number
    overdue: number
    average_completion_time: number
    completion_rate: number
  }
  workflows: {
    total: number
    templates: number
    most_used: Array<{id: string, name: string, usage_count: number}>
  }
}

// Export all admin types
export type AdminEntityType = 'employees' | 'applicants' | 'workflows' | 'forms'

export interface AdminTypeMap {
  employees: AdminEmployee
  applicants: AdminApplicant
  workflows: AdminWorkflow
  forms: AdminForm
}