import { api, downloadFile, generateIdempotencyKey } from '../api'

export type LocationType = 'office' | 'online' | 'department' | 'other'
export type InterviewStatus = 'scheduled' | 'confirmed' | 'cancelled' | 'completed' | 'no_show'
export type ParticipantRole = 'organizer' | 'interviewer' | 'observer'
export type AttendanceStatus = 'pending' | 'accepted' | 'declined' | 'tentative'

export interface Interview {
  id: string
  applicant_id: string
  applicant_name: string
  applicant_surname: string
  applicant_email: string
  applicant_phone?: string
  job_posting_id?: string
  job_title?: string
  organization_id: string
  organization_name: string
  created_by: string
  creator_name: string
  creator_surname: string
  creator_email: string
  title: string
  description?: string
  scheduled_at: string
  duration_minutes: number
  location_type: LocationType
  location?: string
  online_meeting_link?: string
  notes?: string
  status: InterviewStatus
  participant_count: number
  reminder_sent_at?: string
  created_at: string
  updated_at: string
  cancelled_at?: string
  cancellation_reason?: string
  participants?: Participant[]
  attachments?: InterviewAttachment[]
}

export interface Participant {
  id: string
  interview_id: string
  user_id?: string
  user_name?: string
  user_surname?: string
  user_email?: string
  external_email?: string
  external_name?: string
  role: ParticipantRole
  attendance_status: AttendanceStatus
  created_at: string
}

export interface InterviewAttachment {
  id: string
  interview_id: string
  file_path: string
  filename: string
  original_filename: string
  mime_type: string
  file_size: number
  uploaded_by: string
  uploader_name?: string
  uploader_surname?: string
  uploaded_at: string
}

export interface StatusHistoryEntry {
  id: string
  interview_id: string
  old_status?: InterviewStatus
  new_status: InterviewStatus
  changed_by: string
  changed_by_name?: string
  changed_by_surname?: string
  changed_at: string
  notes?: string
}

export interface InterviewFilters {
  page?: number
  limit?: number
  applicantId?: string
  createdBy?: string
  status?: InterviewStatus
  startDate?: string
  endDate?: string
}

export interface CreateInterviewData {
  applicant_id: string
  job_posting_id?: string
  title: string
  description?: string
  scheduled_at: string
  duration_minutes?: number
  location_type: LocationType
  location?: string
  online_meeting_link?: string
  notes?: string
  participants?: ParticipantInput[]
}

export interface UpdateInterviewData {
  title?: string
  description?: string
  scheduled_at?: string
  duration_minutes?: number
  location_type?: LocationType
  location?: string
  online_meeting_link?: string
  notes?: string
}

export interface ParticipantInput {
  user_id?: string
  external_email?: string
  external_name?: string
  role?: ParticipantRole
}

// ============================================
// API Functions
// ============================================

/**
 * Get all interviews with optional filters
 */
export async function getAllInterviews(filters?: InterviewFilters): Promise<Interview[]> {
  const queryParams = new URLSearchParams()

  if (filters) {
    if (filters.page !== undefined) queryParams.append('page', filters.page.toString())
    if (filters.limit !== undefined) queryParams.append('limit', filters.limit.toString())
    if (filters.applicantId) queryParams.append('applicantId', filters.applicantId)
    if (filters.createdBy) queryParams.append('createdBy', filters.createdBy)
    if (filters.status) queryParams.append('status', filters.status)
    if (filters.startDate) queryParams.append('startDate', filters.startDate)
    if (filters.endDate) queryParams.append('endDate', filters.endDate)
  }

  const path = `/admin/interviews${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
  return api<Interview[]>(path, { method: 'GET' })
}

/**
 * Get single interview by ID with full details
 */
export async function getInterviewById(id: string): Promise<Interview> {
  return api<Interview>(`/admin/interviews/${id}`, { method: 'GET' })
}

/**
 * Create a new interview
 */
export async function createInterview(data: CreateInterviewData): Promise<Interview> {
  return api<Interview>('/admin/interviews', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Idempotency-Key': generateIdempotencyKey(),
    },
    body: JSON.stringify(data)
  })
}

/**
 * Update interview details
 */
export async function updateInterview(id: string, data: UpdateInterviewData): Promise<Interview> {
  return api<Interview>(`/admin/interviews/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
}

/**
 * Cancel an interview
 */
export async function cancelInterview(
  id: string,
  reason: string,
  options?: { sendNotification?: boolean; customEmailBody?: string }
): Promise<Interview> {
  return api<Interview>(`/admin/interviews/${id}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'Idempotency-Key': generateIdempotencyKey(),
    },
    body: JSON.stringify({ reason, ...options })
  })
}

/**
 * Mark interview as completed
 */
export async function completeInterview(id: string, notes?: string): Promise<Interview> {
  return api<Interview>(`/admin/interviews/${id}/complete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ notes })
  })
}

/**
 * Mark interview as no-show
 */
export async function markNoShow(id: string, notes?: string): Promise<Interview> {
  return api<Interview>(`/admin/interviews/${id}/no-show`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ notes })
  })
}

/**
 * Confirm attendance for current user
 */
export async function confirmAttendance(id: string): Promise<Participant> {
  return api<Participant>(`/admin/interviews/${id}/confirm`, {
    method: 'POST'
  })
}

/**
 * Add participant to interview
 */
export async function addParticipant(interviewId: string, participant: ParticipantInput): Promise<Participant> {
  return api<Participant>(`/admin/interviews/${interviewId}/participants`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(participant)
  })
}

/**
 * Remove participant from interview
 */
export async function removeParticipant(interviewId: string, participantId: string): Promise<void> {
  return api<void>(`/admin/interviews/${interviewId}/participants/${participantId}`, {
    method: 'DELETE'
  })
}

/**
 * Upload attachment to interview
 */
export async function uploadAttachment(interviewId: string, file: File): Promise<InterviewAttachment> {
  const formData = new FormData()
  formData.append('file', file)

  return api<InterviewAttachment>(`/admin/interviews/${interviewId}/attachments`, {
    method: 'POST',
    body: formData
    // Don't set Content-Type header - browser will set it with boundary
  })
}

/**
 * Delete attachment from interview
 */
export async function deleteAttachment(interviewId: string, attachmentId: string): Promise<void> {
  return api<void>(`/admin/interviews/${interviewId}/attachments/${attachmentId}`, {
    method: 'DELETE'
  })
}

/**
 * Get status history for interview
 */
export async function getStatusHistory(interviewId: string): Promise<StatusHistoryEntry[]> {
  return api<StatusHistoryEntry[]>(`/admin/interviews/${interviewId}/history`, {
    method: 'GET'
  })
}

/**
 * Download interview attachment
 */
export async function downloadInterviewAttachment(interviewId: string, attachmentId: string, filename: string): Promise<void> {
  // Backend doesn't need interviewId in URL for download, but we keep it for consistency
  // The actual endpoint is /admin/interviews/:id/attachments/:attachmentId/download
  // But downloadFile function expects just the path
  await downloadFile(`/admin/interviews/${interviewId}/attachments/${attachmentId}`, filename)
}

/**
 * Resend invitation to applicant
 */
export async function resendApplicantInvitation(interviewId: string): Promise<{ success: boolean; message: string; sentTo: string }> {
  return api<{ success: boolean; message: string; sentTo: string }>(`/admin/interviews/${interviewId}/resend-invitation`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ target: 'applicant' })
  })
}

/**
 * Resend invitation to a specific participant
 */
export async function resendParticipantInvitation(interviewId: string, participantId: string): Promise<{ success: boolean; message: string; sentTo: string }> {
  return api<{ success: boolean; message: string; sentTo: string }>(`/admin/interviews/${interviewId}/resend-invitation`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ target: 'participant', participantId })
  })
}
