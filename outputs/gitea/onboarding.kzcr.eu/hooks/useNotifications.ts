import { useState, useCallback, useRef, useEffect } from 'react'
import { 
    Notification, 
    NotificationResponse,
    getNotifications,
    getUnreadCount, 
    markAsRead, 
    markAllAsRead,
    getPreferences,
    updatePreferences,
    NotificationPreferences,
    getTypePreferences,
    updateTypePreferences,
    TypePreferences
} from '@/lib/api/notifications'

export interface UseNotificationsReturn {
    // Notifications (cursor-based with page-like interface)
    notifications: Notification[]
    loading: boolean
    error: string | null
    hasMore: boolean
    nextCursor?: string
    
    // Page-like interface (built on top of cursor pagination)
    currentPage: number
    pageSize: number
    canGoNext: boolean
    canGoPrev: boolean
    totalLoaded: number
    
    // Actions
    loadNotifications: (loadMore?: boolean) => Promise<void>
    loadPage: (pageSize?: number) => Promise<void>
    loadNextPage: () => Promise<void>
    loadPrevPage: () => Promise<void>
    setPageSize: (size: number) => void
    
    markNotificationAsRead: (id: string) => Promise<void>
    markAllNotificationsAsRead: () => Promise<void>
    
    // Unread count
    unreadCount: number
    refreshUnreadCount: () => Promise<void>
    
    // Preferences
    preferences: NotificationPreferences | null
    preferencesLoading: boolean
    loadPreferences: () => Promise<void>
    updateNotificationPreferences: (prefs: { inAppEnabled: boolean; emailEnabled: boolean }) => Promise<void>
    
    // Type-specific preferences
    loadTypePreferences: (typeCode: string) => Promise<TypePreferences>
    updateNotificationTypePreferences: (typeCode: string, prefs: { inAppEnabled?: boolean | null; emailEnabled?: boolean | null }) => Promise<TypePreferences>
}

export const useNotifications = (): UseNotificationsReturn => {
    // Notifications state (cursor-based)
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [hasMore, setHasMore] = useState(true)
    const [nextCursor, setNextCursor] = useState<string>()
    
    // Page-like state (built on cursor pagination)
    const [currentPage, setCurrentPage] = useState(1)
    const [pageSize, setPageSize] = useState(20)
    const [pageHistory, setPageHistory] = useState<Array<{page: number, cursor: string | null, notifications: Notification[]}>>([])
    
    // Unread count state
    const [unreadCount, setUnreadCount] = useState(0)
    
    // Preferences state
    const [preferences, setPreferences] = useState<NotificationPreferences | null>(null)
    const [preferencesLoading, setPreferencesLoading] = useState(false)
    
    // Track if notifications have been loaded initially
    const hasLoadedInitial = useRef(false)

    const loadNotifications = useCallback(async (loadMore = false) => {
        if (!loadMore) {
            setNotifications([])
            setNextCursor(undefined)
            setHasMore(true)
            hasLoadedInitial.current = false
        }
        
        setLoading(true)
        setError(null)
        
        try {
            const cursor = loadMore ? nextCursor : undefined
            const response = await getNotifications(50, cursor)
            
            if (loadMore) {
                setNotifications(prev => [...prev, ...response.notifications])
            } else {
                setNotifications(response.notifications)
                hasLoadedInitial.current = true
            }
            
            setHasMore(response.hasMore)
            setNextCursor(response.nextCursor)
            
        } catch (err) {
            console.error('Failed to load notifications:', err)
            setError(err instanceof Error ? err.message : 'Failed to load notifications')
        } finally {
            setLoading(false)
        }
    }, [nextCursor])

    const refreshUnreadCount = useCallback(async () => {
        try {
            const result = await getUnreadCount()
            setUnreadCount(result.count)
        } catch (err) {
            console.error('Failed to get unread count:', err)
        }
    }, [])

    const markNotificationAsRead = useCallback(async (id: string) => {
        // Check if notification was unread BEFORE making API call and updating state
        const notification = notifications.find(n => n.id === id)
        const wasUnread = notification && !notification.readAt
        
        try {
            await markAsRead(id)
            
            // Optimistically update local state
            setNotifications(prev => prev.map(notification => 
                notification.id === id 
                    ? { ...notification, readAt: new Date().toISOString() }
                    : notification
            ))
            
            // Update cached pages as well
            setPageHistory(prev => prev.map(page => ({
                ...page,
                notifications: page.notifications.map(notification =>
                    notification.id === id 
                        ? { ...notification, readAt: new Date().toISOString() }
                        : notification
                )
            })))
            
            // Decrease unread count if it was unread (check before state update)
            if (wasUnread) {
                setUnreadCount(prev => Math.max(0, prev - 1))
            }
            
            // Refresh unread count from server to ensure accuracy
            setTimeout(() => {
                refreshUnreadCount().catch(err => {
                    console.error('Failed to refresh unread count after mark as read:', err)
                })
            }, 100)
            
        } catch (err) {
            console.error('Failed to mark notification as read:', err)
            throw err
        }
    }, [notifications])

    const markAllNotificationsAsRead = useCallback(async () => {
        try {
            const result = await markAllAsRead()
            
            if (result.success) {
                // Mark all loaded notifications as read
                setNotifications(prev => prev.map(notification => ({
                    ...notification,
                    readAt: notification.readAt || new Date().toISOString()
                })))
                
                // Mark all cached notifications as read
                setPageHistory(prev => prev.map(page => ({
                    ...page,
                    notifications: page.notifications.map(notification => ({
                        ...notification,
                        readAt: notification.readAt || new Date().toISOString()
                    }))
                })))
                
                // Reset unread count
                setUnreadCount(0)
            }
        } catch (err) {
            console.error('Failed to mark all notifications as read:', err)
            throw err
        }
    }, [])

    const loadPreferences = useCallback(async () => {
        setPreferencesLoading(true)
        try {
            const prefs = await getPreferences()
            setPreferences(prefs)
        } catch (err) {
            console.error('Failed to load preferences:', err)
        } finally {
            setPreferencesLoading(false)
        }
    }, [])

    const updateNotificationPreferences = useCallback(async (prefs: { 
        inAppEnabled: boolean; 
        emailEnabled: boolean 
    }) => {
        try {
            const updated = await updatePreferences(prefs)
            setPreferences(updated)
        } catch (err) {
            console.error('Failed to update preferences:', err)
            throw err
        }
    }, [])

    // Smart page loading using cursor pagination
    const loadPage = useCallback(async (requestedPageSize = pageSize) => {
        setLoading(true)
        setError(null)
        
        try {
            // Check if we have this page cached
            const cachedPage = pageHistory.find(p => p.page === currentPage)
            if (cachedPage && requestedPageSize === pageSize) {
                setNotifications(cachedPage.notifications)
                setLoading(false)
                return
            }

            // Load fresh data
            const response = await getNotifications(requestedPageSize, currentPage === 1 ? null : nextCursor)
            setNotifications(response.notifications)
            setHasMore(response.hasMore)
            setNextCursor(response.nextCursor)
            
            // Cache this page
            setPageHistory(prev => {
                const newHistory = prev.filter(p => p.page !== currentPage)
                return [...newHistory, {
                    page: currentPage,
                    cursor: currentPage === 1 ? null : nextCursor,
                    notifications: response.notifications
                }]
            })
            
        } catch (err) {
            console.error('Failed to load notifications page:', err)
            setError(err instanceof Error ? err.message : 'Failed to load notifications')
        } finally {
            setLoading(false)
        }
    }, [currentPage, pageSize, nextCursor, pageHistory])

    const loadNextPage = useCallback(async () => {
        if (!hasMore) return
        
        setCurrentPage(prev => prev + 1)
        
        // We'll load the page in useEffect when currentPage changes
    }, [hasMore])

    const loadPrevPage = useCallback(async () => {
        if (currentPage <= 1) return
        
        setCurrentPage(prev => Math.max(1, prev - 1))
        
        // We'll load the page in useEffect when currentPage changes  
    }, [currentPage])

    const handlePageSizeChange = useCallback((size: number) => {
        setPageSize(size)
        setCurrentPage(1) // Reset to first page when changing page size
        setPageHistory([]) // Clear cache when changing page size
        setNextCursor(undefined)
    }, [])

    const loadTypePreferences = useCallback(async (typeCode: string): Promise<TypePreferences> => {
        try {
            return await getTypePreferences(typeCode)
        } catch (err) {
            console.error('Failed to load type preferences:', err)
            throw err
        }
    }, [])

    const updateNotificationTypePreferences = useCallback(async (
        typeCode: string, 
        prefs: { inAppEnabled?: boolean | null; emailEnabled?: boolean | null }
    ): Promise<TypePreferences> => {
        try {
            return await updateTypePreferences(typeCode, prefs)
        } catch (err) {
            console.error('Failed to update type preferences:', err)
            throw err
        }
    }, [])

    // Auto-refresh unread count periodically
    useEffect(() => {
        // Create a local function to avoid closure issues
        const fetchUnreadCount = async () => {
            try {
                const result = await getUnreadCount()
                setUnreadCount(result.count)
            } catch (err) {
                console.error('Failed to get unread count:', err)
            }
        }
        
        // Initial load
        fetchUnreadCount()
        
        // Set up periodic refresh every 30 seconds
        const interval = setInterval(fetchUnreadCount, 30000)
        
        return () => clearInterval(interval)
    }, []) // Remove refreshUnreadCount dependency to prevent infinite loop

    // Load page when currentPage or pageSize changes
    useEffect(() => {
        if (currentPage > 0) {
            const loadCurrentPage = async () => {
                setLoading(true)
                setError(null)
                
                try {
                    // Check if we have this page cached
                    const cachedPage = pageHistory.find(p => p.page === currentPage)
                    if (cachedPage) {
                        setNotifications(cachedPage.notifications)
                        return
                    }

                    // Load fresh data
                    const response = await getNotifications(pageSize, currentPage === 1 ? null : nextCursor)
                    setNotifications(response.notifications)
                    setHasMore(response.hasMore)
                    setNextCursor(response.nextCursor)
                    
                } catch (err) {
                    console.error('Failed to load notifications page:', err)
                    setError(err instanceof Error ? err.message : 'Failed to load notifications')
                } finally {
                    setLoading(false)
                }
            }
            
            loadCurrentPage()
        }
    }, [currentPage, pageSize]) // Safe dependencies that won't cause infinite loops

    return {
        // Notifications (cursor-based with page-like interface)
        notifications,
        loading,
        error,
        hasMore,
        nextCursor,
        
        // Page-like interface (built on top of cursor pagination)
        currentPage,
        pageSize,
        canGoNext: hasMore,
        canGoPrev: currentPage > 1,
        totalLoaded: pageHistory.reduce((acc, page) => acc + page.notifications.length, 0),
        
        // Actions
        loadNotifications,
        loadPage,
        loadNextPage,
        loadPrevPage,
        setPageSize: handlePageSizeChange,
        
        markNotificationAsRead,
        markAllNotificationsAsRead,
        
        // Unread count
        unreadCount,
        refreshUnreadCount,
        
        // Preferences
        preferences,
        preferencesLoading,
        loadPreferences,
        updateNotificationPreferences,
        
        // Type-specific preferences
        loadTypePreferences,
        updateNotificationTypePreferences
    }
}