import { api, downloadFile, generateIdempotencyKey } from '../api'

export interface Applicant {
  id: string
  name: string
  surname: string
  email: string
  phone: string
  address: string
  city: string
  zip: string
  education: string
  field: string
  experience: string
  last_employer: string
  last_position: string
  gdpr_consent: boolean
  current_status: string
  job_posting_id: string
  organization_id: string
  applied_at: string
  job_title: string
  organization_name: string
  current_status_name?: string
  current_status_description?: string
}

export interface StatusUpdateData {
  status: string
  notes?: string
  changed_by?: string | null
}

export interface StatusHistoryEntry {
  id: string
  applicant_id: string
  status_name: string
  changed_at: string
  changed_by: string
  notes: string
  changed_by_name?: string
  changed_by_surname?: string
}

export interface Attachment {
  id: string
  applicant_id: string
  filename: string
  original_filename: string
  mime_type: string
  file_size: number
  file_path: string
  uploaded_at: string
  status: string
  status_description?: string
  status_color?: string
  reviewed_by?: string
  reviewed_at?: string
  review_notes?: string
  reviewed_by_name?: string
  reviewed_by_surname?: string
}

export interface ApplicantNote {
  id: string
  applicant_id: string
  author_id: string
  note: string
  created_at: string
  updated_at: string
  author_name?: string
  author_surname?: string
  author_email?: string
}

export interface CreateNoteData {
  note: string
  author_id?: string | null
}

export interface DocumentStatus {
  name: string
  description: string
  color: string
}

export interface UpdateAttachmentStatusData {
  status: string
  review_notes?: string
}

export interface PaginationInfo {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

export interface ApplicantsResponse {
  data: Applicant[]
  pagination: PaginationInfo
}

export interface ApplicantsQuery {
  page?: number
  limit?: number
  search?: string
  status?: string
  organization?: string
}

// Get all applicants with pagination and filtering
export const getAllApplicants = async (query: ApplicantsQuery = {}): Promise<ApplicantsResponse> => {
  const params = new URLSearchParams()
  
  if (query.page) params.append('page', query.page.toString())
  if (query.limit) params.append('limit', query.limit.toString())
  if (query.search) params.append('search', query.search)
  if (query.status) params.append('status', query.status)
  if (query.organization) params.append('organization', query.organization)
  
  const queryString = params.toString()
  const url = queryString ? `/admin/applicants?${queryString}` : '/admin/applicants'
  
  return api<ApplicantsResponse>(url)
}

// Get applicant by ID
export const getApplicantById = async (id: string): Promise<Applicant> => {
  return api<Applicant>(`/admin/applicants/${id}`)
}

// Create new applicant (admin only) with optional file attachments
export const createApplicant = async (applicantData: FormData): Promise<{message: string, applicant: Applicant, attachments: Attachment[]}> => {
  return api<{message: string, applicant: Applicant, attachments: Attachment[]}>('/admin/applicants', {
    method: 'POST',
    headers: { 'Idempotency-Key': generateIdempotencyKey() },
    body: applicantData,
    // Don't set Content-Type header - let browser set it for FormData with boundary
  })
}

// Update applicant status
export const updateApplicantStatus = async (
  id: string, 
  statusData: StatusUpdateData
): Promise<Applicant> => {
  return api<Applicant>(`/admin/applicants/${id}/status`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Idempotency-Key': generateIdempotencyKey(),
    },
    body: JSON.stringify(statusData),
  })
}

// Get applicant status history
export const getApplicantHistory = async (id: string): Promise<StatusHistoryEntry[]> => {
  return api<StatusHistoryEntry[]>(`/admin/applicants/${id}/history`)
}

// Get applicant attachments
export const getApplicantAttachments = async (id: string): Promise<Attachment[]> => {
  return api<Attachment[]>(`/admin/applicants/${id}/attachments`)
}

// Get applicant notes
export const getApplicantNotes = async (id: string): Promise<ApplicantNote[]> => {
  return api<ApplicantNote[]>(`/admin/applicants/${id}/notes`)
}

// Create applicant note
export const createApplicantNote = async (id: string, noteData: CreateNoteData): Promise<ApplicantNote> => {
  return api<ApplicantNote>(`/admin/applicants/${id}/notes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(noteData),
  })
}

// Update applicant note
export const updateApplicantNote = async (noteId: string, note: string): Promise<ApplicantNote> => {
  return api<ApplicantNote>(`/admin/applicants/notes/${noteId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ note }),
  })
}

// Delete applicant note
export const deleteApplicantNote = async (noteId: string): Promise<void> => {
  return api<void>(`/admin/applicants/notes/${noteId}`, {
    method: 'DELETE',
  })
}

// Get applicants by job ID
export const getApplicantsByJob = async (jobId: string): Promise<Applicant[]> => {
  return api<Applicant[]>(`/admin/applicants/job/${jobId}`)
}

// Download attachment file
export const downloadAttachment = async (attachmentId: string, filename: string): Promise<void> => {
  return downloadFile(`/admin/applicants/attachments/${attachmentId}/download`, filename)
}

// Update attachment status
export const updateAttachmentStatus = async (attachmentId: string, statusData: UpdateAttachmentStatusData): Promise<Attachment> => {
  return api<Attachment>(`/admin/applicants/attachments/${attachmentId}/status`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(statusData),
  })
}

// Get all document statuses
export const getDocumentStatuses = async (): Promise<DocumentStatus[]> => {
  return api<DocumentStatus[]>(`/admin/applicants/document-statuses`)
}


export interface SendEmailResponse {
  success: boolean
  message: string
  messageId?: string
  sentTo?: string
  error?: string
}

// Send email to applicant
export const sendEmailToApplicant = async (applicantId: string, data: FormData): Promise<SendEmailResponse> => {
  return api<SendEmailResponse>(`/admin/applicants/${applicantId}/send-email`, {
    method: 'POST',
    body: data,
  })
}

// CV Analysis types
export interface CVEducation {
  institution: string
  degree: string
  field: string
  year: string
}

export interface CVExperience {
  company: string
  position: string
  duration: string
  description: string
}

export interface CVAnalysis {
  id?: string
  attachment_id?: string
  applicant_id: string
  organization_id?: string
  // Status tracking for async processing
  status?: 'pending' | 'processing' | 'completed' | 'failed'
  error_message?: string | null
  created_at?: string
  started_at?: string | null
  failed_at?: string | null
  // Analysis data (only present when status is 'completed')
  candidate_name?: string | null
  candidate_email?: string | null
  candidate_phone?: string | null
  skills?: string[]
  languages?: string[]
  certifications?: string[]
  education?: CVEducation[]
  experience?: CVExperience[]
  summary?: string | null
  verbal_evaluation?: string | null
  evaluation_score?: number | null
  evaluation_reasoning?: string | null
  evaluation_strengths?: string[]
  evaluation_weaknesses?: string[]
  model_used?: string
  embedding_model?: string
  processing_time_ms?: number
  processed_at?: string
}

// Get CV analysis for an applicant
export const getCVAnalysis = async (applicantId: string): Promise<CVAnalysis | null> => {
  try {
    return await api<CVAnalysis>(`/admin/cv-analysis/${applicantId}`)
  } catch {
    return null
  }
}

// Trigger CV reanalysis
export const triggerCVReanalysis = async (applicantId: string): Promise<{ success: boolean; message: string }> => {
  return api<{ success: boolean; message: string }>(`/admin/cv-analysis/${applicantId}/reanalyze`, {
    method: 'POST',
  })
}

export interface ScheduleInterviewData {
  dateTime: string
  location: string
  locationType: string
  participants: string
  notes?: string
}

export interface ScheduleInterviewResponse {
  success: boolean
  message: string
  messageId?: string
  sentTo?: string
  error?: string
}

// Schedule interview and send invitation email
export const scheduleInterview = async (applicantId: string, data: ScheduleInterviewData): Promise<ScheduleInterviewResponse> => {
  return api<ScheduleInterviewResponse>(`/admin/applicants/${applicantId}/schedule-interview`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
}
