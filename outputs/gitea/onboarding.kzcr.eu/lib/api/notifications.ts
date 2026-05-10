import { api } from '@/lib/api'

export interface Notification {
    id: string
    type: string
    typeLabel: string
    typeDescription: string
    title: string
    body?: string
    data: Record<string, any>
    actionUrl?: string
    readAt?: string
    isArchived: boolean
    createdAt: string
}

export interface NotificationResponse {
    notifications: Notification[]
    hasMore: boolean
    nextCursor?: string
}

// Remove fake pagination interface since backend uses cursor-based pagination

export interface NotificationPreferences {
    inAppEnabled: boolean
    emailEnabled: boolean
    updatedAt?: string
}

export interface TypePreferences {
    inAppEnabled?: boolean | null
    emailEnabled?: boolean | null
    updatedAt?: string
}

/**
 * Get notifications for current user with cursor-based pagination (legacy)
 */
export const getNotifications = async (limit = 50, cursor?: string): Promise<NotificationResponse> => {
    const params = new URLSearchParams()
    params.append('limit', limit.toString())
    if (cursor) {
        params.append('cursor', cursor)
    }
    
    const query = params.toString() ? `?${params.toString()}` : ''
    return api<NotificationResponse>(`/notifications${query}`)
}

// Remove fake paginated API - backend only supports cursor-based pagination

/**
 * Get unread notification count
 */
export const getUnreadCount = async (): Promise<{ count: number }> => {
    return api<{ count: number }>('/notifications/unread_count')
}

/**
 * Mark specific notification as read
 */
export const markAsRead = async (notificationId: string): Promise<{ success: boolean }> => {
    return api<{ success: boolean }>(`/notifications/${notificationId}/read`, {
        method: 'POST'
    })
}

/**
 * Mark all notifications as read
 */
export const markAllAsRead = async (): Promise<{ success: boolean; markedCount: number }> => {
    return api<{ success: boolean; markedCount: number }>('/notifications/read_all', {
        method: 'POST'
    })
}

/**
 * Get notification preferences
 */
export const getPreferences = async (): Promise<NotificationPreferences> => {
    return api<NotificationPreferences>('/notifications/preferences')
}

/**
 * Update notification preferences
 */
export const updatePreferences = async (preferences: {
    inAppEnabled: boolean
    emailEnabled: boolean
}): Promise<NotificationPreferences> => {
    return api<NotificationPreferences>('/notifications/preferences', {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(preferences)
    })
}

/**
 * Get type-specific preferences
 */
export const getTypePreferences = async (typeCode: string): Promise<TypePreferences> => {
    return api<TypePreferences>(`/notifications/preferences/types/${typeCode}`)
}

/**
 * Update type-specific preferences
 */
export const updateTypePreferences = async (
    typeCode: string, 
    preferences: {
        inAppEnabled?: boolean | null
        emailEnabled?: boolean | null
    }
): Promise<TypePreferences> => {
    return api<TypePreferences>(`/notifications/preferences/types/${typeCode}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(preferences)
    })
}