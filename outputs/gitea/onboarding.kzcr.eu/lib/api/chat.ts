import { api, generateIdempotencyKey } from '@/lib/api'

export interface ChatMessage {
    id: string
    senderId: string
    recipientId: string
    body?: string
    createdAt: string
    editedAt?: string
    attachments: ChatAttachment[]
}

export interface ChatAttachment {
    id: string
    originalName: string
    mimeType?: string
    fileSize?: number
    uploadedAt?: string
}

export interface ChatThread {
    peerUserId: string
    peerName?: string
    peerSurname?: string
    peerEmail?: string
    lastMessage: {
        id: string
        body?: string
        createdAt: string
        hasAttachments: boolean
        senderId: string
    }
    unreadCount: number
}

export interface SendMessageData {
    body?: string
    files?: File[]
}

export interface PaginationOptions {
    limit?: number
    offset?: number
}

export interface MessagePaginationOptions {
    limit?: number
    cursorCreatedAt?: string
    cursorId?: string
}

/**
 * Get list of conversation threads for current user
 */
export const getThreads = async (options: PaginationOptions = {}): Promise<ChatThread[]> => {
    const params = new URLSearchParams()
    if (options.limit) params.append('limit', options.limit.toString())
    if (options.offset) params.append('offset', options.offset.toString())
    
    const query = params.toString() ? `?${params.toString()}` : ''
    return api<ChatThread[]>(`/chat/threads${query}`)
}

/**
 * Get messages in a conversation with another user
 */
export const getMessages = async (
    withUserId: string, 
    options: MessagePaginationOptions = {}
): Promise<ChatMessage[]> => {
    const params = new URLSearchParams()
    if (options.limit) params.append('limit', options.limit.toString())
    if (options.cursorCreatedAt) params.append('cursorCreatedAt', options.cursorCreatedAt)
    if (options.cursorId) params.append('cursorId', options.cursorId)
    
    const query = params.toString() ? `?${params.toString()}` : ''
    return api<ChatMessage[]>(`/chat/${withUserId}/messages${query}`)
}

/**
 * Send a message with optional file attachments
 */
export const sendMessage = async (
    withUserId: string, 
    data: SendMessageData
): Promise<ChatMessage> => {
    const formData = new FormData()
    
    if (data.body) {
        formData.append('body', data.body)
    }
    
    if (data.files && data.files.length > 0) {
        data.files.forEach(file => {
            formData.append('files', file)
        })
    }
    
    return api<ChatMessage>(`/chat/${withUserId}/messages`, {
        method: 'POST',
        headers: { 'Idempotency-Key': generateIdempotencyKey() },
        body: formData
    })
}

/**
 * Mark messages as read up to a specific message
 */
export const markAsRead = async (
    withUserId: string, 
    upToMessageId: string
): Promise<{ success: boolean; markedAsRead: number }> => {
    return api<{ success: boolean; markedAsRead: number }>(`/chat/${withUserId}/read`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ upToMessageId })
    })
}

import { downloadFile } from '../api'

/**
 * Download a chat attachment using the unified download function
 */
export const downloadAttachment = async (attachmentId: string, filename: string): Promise<void> => {
    // Use the unified download function
    await downloadFile(`/chat/attachments/${attachmentId}`, filename)
}

/**
 * Delete a message (sender only)
 */
export const deleteMessage = async (messageId: string): Promise<{ success: boolean }> => {
    return api<{ success: boolean }>(`/chat/messages/${messageId}`, {
        method: 'DELETE'
    })
}

/**
 * Get all users available for starting new chats (admin only)
 */
export const getAvailableUsers = async (): Promise<Array<{
    id: string
    name: string
    surname?: string  
    email: string
    organization?: string
}>> => {
    const response = await api<Array<{
        id: string
        name: string
        surname?: string
        email: string
        organization_name?: string
    }>>('/chat/available-users', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    })

    return response.map(user => ({
        id: user.id,
        name: user.name,
        surname: user.surname,
        email: user.email,
        organization: user.organization_name
    }))
}

/**
 * Delete entire conversation with a user (HR/Admin only)
 */
export const deleteConversation = async (withUserId: string): Promise<{
    success: boolean
    message: string
    deletedMessages: number
}> => {
    return api<{
        success: boolean
        message: string
        deletedMessages: number
    }>(`/chat/conversations/${withUserId}`, {
        method: 'DELETE'
    })
}

/**
 * Get HR users available for chat (for employee users)
 */
export const getAvailableHRUsers = async (): Promise<Array<{
    id: string
    name: string
    surname?: string
    email: string
    organization?: string
}>> => {
    const response = await api<Array<{
        id: string
        name: string
        surname?: string
        email: string
        organization_name?: string
    }>>('/chat/available-hr-users', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    
    // Transform organization_name to organization
    return response.map(user => ({
        id: user.id,
        name: user.name,
        surname: user.surname,
        email: user.email,
        organization: user.organization_name
    }))
}
