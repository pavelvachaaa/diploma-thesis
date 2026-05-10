'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useNotifications } from '@/hooks/useNotifications'
import NotificationItem from '@/components/notifications/NotificationItem'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { NotificationPagination } from '@/components/notifications/NotificationPagination'
import { CheckCheck, Settings, Loader2, Filter } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'

type NotificationFilter = 'all' | 'unread' | 'chat.message' | 'onboarding.step.completed' | 'document.uploaded' | 'user.created_from_applicant'

export default function AdminNotificationsPage() {
    const router = useRouter()
    const {
        notifications,
        loading,
        error,
        currentPage,
        pageSize,
        canGoNext,
        canGoPrev,
        totalLoaded,
        unreadCount,
        loadPage,
        loadNextPage,
        loadPrevPage,
        setPageSize,
        markNotificationAsRead,
        markAllNotificationsAsRead
    } = useNotifications()

    const [filter, setFilter] = useState<NotificationFilter>('all')
    const hasLoadedInitial = useRef(false)

    // Load initial notifications
    useEffect(() => {
        if (!hasLoadedInitial.current) {
            hasLoadedInitial.current = true
            loadPage()
        }
    }, []) // Remove loadNotificationsPaginated from dependency array

    const handleNotificationClick = async (notification: any) => {
        // Mark as read
        if (!notification.readAt) {
            try {
                await markNotificationAsRead(notification.id)
            } catch (error) {
                console.error('Failed to mark notification as read:', error)
            }
        }

        // Navigate to action URL if available
        if (notification.actionUrl) {
            router.push(notification.actionUrl)
        }
    }

    const handleNextPage = () => {
        loadNextPage()
    }

    const handlePrevPage = () => {
        loadPrevPage()
    }

    const handlePageSizeChange = (size: number) => {
        setPageSize(size)
    }

    const handleMarkAllAsRead = async () => {
        try {
            await markAllNotificationsAsRead()
        } catch (error) {
            console.error('Failed to mark all as read:', error)
        }
    }

    // Filter notifications based on selected filter
    const filteredNotifications = notifications.filter(notification => {
        switch (filter) {
            case 'unread':
                return !notification.readAt
            case 'all':
                return true
            default:
                return notification.type === filter
        }
    })

    // Get notification type counts for badges
    const typeCounts = notifications.reduce((counts, notification) => {
        counts[notification.type] = (counts[notification.type] || 0) + 1
        return counts
    }, {} as Record<string, number>)

    if (loading && notifications.length === 0) {
        return (
            <div className="container mx-auto py-6">
                <Card>
                    <CardContent className="py-12">
                        <div className="flex flex-col items-center justify-center space-y-4">
                            <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
                            <p className="text-gray-500">Načítám notifikace...</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    if (error) {
        return (
            <div className="container mx-auto py-6">
                <Card>
                    <CardContent className="py-12">
                        <div className="flex flex-col items-center justify-center space-y-4">
                            <p className="text-red-600">Chyba při načítání notifikací: {error}</p>
                            <Button onClick={() => {
                                hasLoadedInitial.current = false
                                loadPage()
                            }}>
                                Zkusit znovu
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="container mx-auto py-6">
            <div className="flex flex-col space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            Notifikace
                        </h1>
                        <p className="text-gray-600 mt-1">
                            {unreadCount > 0 
                                ? `Máte ${unreadCount} nepřečtených notifikací`
                                : 'Všechny notifikace zobrazeny!'
                            }
                        </p>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                        {unreadCount > 0 && (
                            <Button
                                variant="outline"
                                onClick={handleMarkAllAsRead}
                                className="flex items-center space-x-2"
                            >
                                <CheckCheck className="h-4 w-4" />
                                <span>Označit vše jako přečtené</span>
                            </Button>
                        )}
                        
                        <Button
                            variant="outline"
                            onClick={() => router.push('/admin/settings/notifications')}
                            className="flex items-center space-x-2"
                        >
                            <Settings className="h-4 w-4" />
                            <span>Nastavení</span>
                        </Button>
                    </div>
                </div>

                {/* Filter Bar */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-lg">Filtrovat notifikace</CardTitle>
                            <div className="flex items-center space-x-2">
                                <Filter className="h-4 w-4 text-gray-500" />
                                <Select value={filter} onValueChange={setFilter as (value: string) => void}>
                                    <SelectTrigger className="w-48">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">
                                            Všechny notifikace ({notifications.length})
                                        </SelectItem>
                                        <SelectItem value="unread">
                                            Nepřečtené ({unreadCount})
                                        </SelectItem>
                                        <SelectItem value="user.created_from_applicant">
                                            Noví uživatelé ({typeCounts['user.created_from_applicant'] || 0})
                                        </SelectItem>
                                        <SelectItem value="document.uploaded">
                                            Dokumenty ({typeCounts['document.uploaded'] || 0})
                                        </SelectItem>
                                        <SelectItem value="onboarding.step.completed">
                                            Onboarding ({typeCounts['onboarding.step.completed'] || 0})
                                        </SelectItem>
                                        <SelectItem value="chat.message">
                                            Zprávy ({typeCounts['chat.message'] || 0})
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardHeader>
                </Card>

                {/* Notifications List */}
                <Card>
                    {filteredNotifications.length === 0 ? (
                        <CardContent className="py-12">
                            <div className="flex flex-col items-center justify-center space-y-4">
                                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
                                    <CheckCheck className="h-8 w-8 text-gray-400" />
                                </div>
                                <div className="text-center">
                                    <h3 className="text-lg font-medium text-gray-900">
                                        {filter === 'all' ? 'Žádné notifikace' : `Žádné ${filter} notifikace`}
                                    </h3>
                                    <p className="text-gray-500 mt-1">
                                        {filter === 'all' 
                                            ? "Zatím nemáte žádné notifikace, až je budete mít, zobrazí se zde."
                                            : `Žádné notifikace neodpovídají vybranému filtru.`
                                        }
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    ) : (
                        <CardContent className="p-0">
                            <div className="divide-y divide-gray-200">
                                {filteredNotifications.map((notification) => (
                                    <NotificationItem
                                        key={notification.id}
                                        notification={notification}
                                        onClick={() => handleNotificationClick(notification)}
                                        className="border-b-0"
                                    />
                                ))}
                            </div>
                            {/* Cursor-based Pagination */}
                            {filter === 'all' && (
                                <div className="border-t">
                                    <NotificationPagination
                                        currentPage={currentPage}
                                        pageSize={pageSize}
                                        totalLoaded={totalLoaded}
                                        canGoNext={canGoNext}
                                        canGoPrev={canGoPrev}
                                        loading={loading}
                                        onNextPage={handleNextPage}
                                        onPrevPage={handlePrevPage}
                                        onPageSizeChange={handlePageSizeChange}
                                    />
                                </div>
                            )}
                        </CardContent>
                    )}
                </Card>
            </div>
        </div>
    )
}