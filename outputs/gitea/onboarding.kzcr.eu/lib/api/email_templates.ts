import { api } from '../api'

export interface EmailTemplate {
  id: string
  organization_id: string
  name: string
  type: string
  subject?: string
  body: string
  created_by?: string
  created_at: string
  updated_at: string
}

export interface CreateEmailTemplateData {
  name: string
  type: string
  subject?: string
  body: string
}

export async function getEmailTemplates(type?: string): Promise<EmailTemplate[]> {
  const params = type ? `?type=${encodeURIComponent(type)}` : ''
  return api<EmailTemplate[]>(`/admin/email-templates${params}`)
}

export async function getEmailTemplateById(id: string): Promise<EmailTemplate> {
  return api<EmailTemplate>(`/admin/email-templates/${id}`)
}

export async function createEmailTemplate(data: CreateEmailTemplateData): Promise<EmailTemplate> {
  return api<EmailTemplate>('/admin/email-templates', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
}

export async function updateEmailTemplate(id: string, data: Partial<CreateEmailTemplateData>): Promise<EmailTemplate> {
  return api<EmailTemplate>(`/admin/email-templates/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
}

export async function deleteEmailTemplate(id: string): Promise<void> {
  return api<void>(`/admin/email-templates/${id}`, { method: 'DELETE' })
}
