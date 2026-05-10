import { api, downloadFile } from '../api'

export interface UserDocument {
  id: string
  user_id: string
  document_id: string
  filename?: string
  original_filename?: string
  mime_type?: string
  file_size?: number
  file_path: string | null
  uploaded_at: string | null
  status: 'pending' | 'approved' | 'rejected'
  reviewed_by?: string
  reviewed_at?: string
  review_notes?: string
  document_name: string
  description: string | null
  document_type: string | null
  required: boolean
  original_name: string
}

export interface DocumentStatusUpdate {
  status: 'pending' | 'approved' | 'rejected'
  notes?: string
}

// Get employee's onboarding documents
export const getEmployeeDocuments = async (employeeId: string): Promise<UserDocument[]> => {
  return api<UserDocument[]>(`/admin/employees/${employeeId}/documents`)
}

// Update document approval status (using unified route)
export const updateDocumentStatus = async (
  id: string, 
  statusUpdate: DocumentStatusUpdate
): Promise<UserDocument> => {
  return api<UserDocument>(`/admin/onboarding-documents/user-documents/${id}/status`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(statusUpdate),
  })
}

// Download employee document (using unified route)
export const downloadEmployeeDocument = async (
  employeeId: string, 
  documentId: string, 
  filename: string
): Promise<void> => {
  return downloadFile(`/admin/onboarding-documents/employees/${employeeId}/documents/${documentId}/download`, filename)
}

// Approve document (convenience method)
export const approveDocument = async (
  id: string, 
  notes?: string
): Promise<UserDocument> => {
  return updateDocumentStatus(id, { status: 'approved', notes })
}

// Reject document (convenience method)
export const rejectDocument = async (
  id: string, 
  notes?: string
): Promise<UserDocument> => {
  return updateDocumentStatus(id, { status: 'rejected', notes })
}

// Reset document to pending (convenience method)
export const resetDocumentStatus = async (
  id: string,
  notes?: string
): Promise<UserDocument> => {
  return updateDocumentStatus(id, { status: 'pending', notes })
}

// Upload document on behalf of employee (admin/HR only)
export const uploadDocumentForEmployee = async (
  employeeId: string,
  documentId: string,
  file: File
): Promise<UserDocument> => {
  const formData = new FormData()
  formData.append('file', file)
  return api<UserDocument>(`/admin/employees/${employeeId}/documents/${documentId}/upload`, {
    method: 'POST',
    body: formData,
  })
}