'use client'

import { useState, useEffect } from 'react'
import { Bell } from 'lucide-react'
import { useNotifications } from '@/hooks/useNotifications'
import { useRouter } from 'next/navigation'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
    DropdownMenuLabel
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import NotificationItem from './NotificationItem'
// import { ScrollArea } from '@/components/ui/scroll-area'

interface NotificationBellProps {
    className?: string
}

export default function NotificationBell({ className }: NotificationBellProps) {
    const router = useRouter()
    const { 
        notifications, 
        loading, 
        unreadCount, 
        loadNotifications, 
        markNotificationAsRead,
        markAllNotificationsAsRead
    } = useNotifications()
    
    const [isOpen, setIsOpen] = useState(false)

    // Load recent notifications when dropdown opens
    useEffect(() => {
        if (isOpen && notifications.length === 0) {
            loadNotifications()
        }
    }, [isOpen, notifications.length]) // Remove loadNotifications dependency to prevent infinite loop

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

        // Close dropdown
        setIsOpen(false)
    }

    const handleMarkAllAsRead = async () => {
        try {
            await markAllNotificationsAsRead()
        } catch (error) {
            console.error('Failed to mark all as read:', error)
        }
    }

    const handleViewAll = () => {
        router.push('/admin/notifications')
        setIsOpen(false)
    }

    // Get recent unread notifications for dropdown
    const recentNotifications = notifications.slice(0, 5)

    return (
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
            <DropdownMenuTrigger asChild>
                <Button 
                    variant="ghost" 
                    size="icon"
                    className={cn("relative", className)}
                >
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs font-medium flex items-center justify-center">
                            {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                    )}
                </Button>
            </DropdownMenuTrigger>
            
            <DropdownMenuContent 
                align="end" 
                className="w-96 p-0"
                sideOffset={8}
            >
                <div className="flex items-center justify-between px-4 py-3 border-b">
                    <DropdownMenuLabel className="p-0">
                        Notifikace
                        {unreadCount > 0 && (
                            <span className="ml-2 text-sm text-gray-500">
                                ({unreadCount} nepřečtených)
                            </span>
                        )}
                    </DropdownMenuLabel>
                    
                    {unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleMarkAllAsRead}
                            className="text-xs"
                        >
                            Označit vše jako přečtené
                        </Button>
                    )}
                </div>

                {loading && notifications.length === 0 ? (
                    <div className="py-6 text-center text-sm text-gray-500">
                        Načítám notifikace
                    </div>
                ) : recentNotifications.length === 0 ? (
                    <div className="py-6 text-center text-sm text-gray-500">
                        Žádné nové notifikace
                    </div>
                ) : (
                    <>
                        <div className="max-h-80 overflow-y-auto">
                            {recentNotifications.map((notification) => (
                                <div key={notification.id}>
                                    <NotificationItem
                                        notification={notification}
                                        onClick={() => handleNotificationClick(notification)}
                                        className="border-b-0 hover:bg-gray-50"
                                    />
                                </div>
                            ))}
                        </div>
                        
                        <DropdownMenuSeparator />
                        
                        <DropdownMenuItem 
                            onClick={handleViewAll}
                            className="text-center justify-center py-3 text-sm font-medium text-blue-600 hover:text-blue-700"
                        >
                            Zobrazit vše
                        </DropdownMenuItem>
                    </>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}