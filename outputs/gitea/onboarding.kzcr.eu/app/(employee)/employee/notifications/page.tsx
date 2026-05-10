'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useNotifications } from '@/hooks/useNotifications'
import NotificationItem from '@/components/notifications/NotificationItem'
import { NotificationPagination } from '@/components/notifications/NotificationPagination'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCheck, Settings, Loader2 } from 'lucide-react'

export default function EmployeeNotificationsPage() {
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

    const hasLoadedInitial = useRef(false)

    // Load initial notifications
    useEffect(() => {
        if (!hasLoadedInitial.current) {
            hasLoadedInitial.current = true
            loadPage()
        }
    }, []) // Remove loadPage from dependency array to prevent infinite loops

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

    if (loading && notifications.length === 0) {
        return (
            <div className="container mx-auto py-6">
                <Card>
                    <CardContent className="py-12">
                        <div className="flex flex-col items-center justify-center space-y-4">
                            <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
                            <p className="text-gray-500">Načítání notifikací...</p>
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
                            <p className="text-red-600">Error při načítání notifikací: {error}</p>
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
                            onClick={() => router.push('/employee/settings/notifications')}
                            className="flex items-center space-x-2"
                        >
                            <Settings className="h-4 w-4" />
                            <span>Nastavení</span>
                        </Button>
                    </div>
                </div>

                {/* Notifications List */}
                <Card>
                    {notifications.length === 0 ? (
                        <CardContent className="py-12">
                            <div className="flex flex-col items-center justify-center space-y-4">
                                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
                                    <CheckCheck className="h-8 w-8 text-gray-400" />
                                </div>
                                <div className="text-center">
                                    <h3 className="text-lg font-medium text-gray-900">
                                        Žádné notifikace
                                    </h3>
                                    <p className="text-gray-500 mt-1">
                                        Zatím nemáte žádné notifikace, až je budete mít, zobrazí se zde.
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    ) : (
                        <CardContent className="p-0">
                            <div className="divide-y divide-gray-200">
                                {notifications.map((notification) => (
                                    <NotificationItem
                                        key={notification.id}
                                        notification={notification}
                                        onClick={() => handleNotificationClick(notification)}
                                        className="border-b-0"
                                    />
                                ))}
                            </div>

                            {/* Cursor-based Pagination */}
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
                        </CardContent>
                    )}
                </Card>
            </div>
        </div>
    )
}