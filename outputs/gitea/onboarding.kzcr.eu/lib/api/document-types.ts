import { api } from '../api'

export interface DocumentType {
  id: string
  name: string
  description?: string
}

// Get all document types
export const getAllDocumentTypes = async (): Promise<DocumentType[]> => {
  return api<DocumentType[]>('/admin/document_types')
}

// Get document type by ID
export const getDocumentTypeById = async (id: string): Promise<DocumentType> => {
  return api<DocumentType>(`/admin/document_types/${id}`)
}

// Create new document type
export const createDocumentType = async (documentTypeData: Partial<DocumentType>): Promise<DocumentType> => {
  return api<DocumentType>('/admin/document_types', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(documentTypeData),
  })
}

// Update document type
export const updateDocumentType = async (id: string, documentTypeData: Partial<DocumentType>): Promise<DocumentType> => {
  return api<DocumentType>(`/admin/document_types/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(documentTypeData),
  })
}

// Delete document type
export const deleteDocumentType = async (id: string): Promise<void> => {
  return api<void>(`/admin/document_types/${id}`, {
    method: 'DELETE',
  })
}