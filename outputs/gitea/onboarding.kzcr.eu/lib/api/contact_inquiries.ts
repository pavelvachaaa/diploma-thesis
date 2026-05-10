import { api } from '../api'

export interface ContactInquiry {
  id: string
  name: string
  email: string
  phone: string | null
  message: string
  gdpr_consent: boolean
  submitted_at: string
  last_replied_at: string | null
  last_replied_by_user_id: string | null
  last_replied_by_name: string | null
  last_replied_by_surname: string | null
  last_replied_by_email: string | null
  last_reply_subject: string | null
  last_reply_message: string | null
  status: 'answered' | 'unanswered'
}

export interface ContactInquiriesResponse {
  data: ContactInquiry[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

export interface ContactInquiriesQuery {
  page?: number
  limit?: number
  search?: string
  status?: 'all' | 'answered' | 'unanswered'
}

export interface SendContactInquiryReplyData {
  subject: string
  message: string
}

export interface SendContactInquiryReplyResponse {
  success: boolean
  message: string
  inquiry: ContactInquiry
}

export const getAllContactInquiries = async (query: ContactInquiriesQuery = {}): Promise<ContactInquiriesResponse> => {
  const params = new URLSearchParams()

  if (query.page !== undefined) params.append('page', query.page.toString())
  if (query.limit !== undefined) params.append('limit', query.limit.toString())
  if (query.search) params.append('search', query.search)
  if (query.status) params.append('status', query.status)

  const queryString = params.toString()
  const url = queryString ? `/admin/contact-inquiries?${queryString}` : '/admin/contact-inquiries'

  return api<ContactInquiriesResponse>(url)
}

export const getContactInquiryById = async (id: string): Promise<ContactInquiry> => {
  return api<ContactInquiry>(`/admin/contact-inquiries/${id}`)
}

export const sendReplyToContactInquiry = async (
  id: string,
  data: SendContactInquiryReplyData
): Promise<SendContactInquiryReplyResponse> => {
  return api<SendContactInquiryReplyResponse>(`/admin/contact-inquiries/${id}/send-email`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
}
