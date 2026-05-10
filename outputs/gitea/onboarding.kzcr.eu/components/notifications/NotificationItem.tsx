'use client'

import { formatDistance } from 'date-fns'
import { cs } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { Notification } from '@/lib/api/notifications'
import { Bell, MessageSquare, CheckCircle, FileText, UserPlus } from 'lucide-react'

interface NotificationItemProps {
    notification: Notification
    onClick?: () => void
    className?: string
}

const getNotificationIcon = (type: string) => {
    switch (type) {
        case 'chat.message':
            return <MessageSquare className="h-4 w-4" />
        case 'onboarding.step.completed':
            return <CheckCircle className="h-4 w-4" />
        case 'document.uploaded':
            return <FileText className="h-4 w-4" />
        case 'user.created_from_applicant':
            return <UserPlus className="h-4 w-4" />
        default:
            return <Bell className="h-4 w-4" />
    }
}

const getNotificationColor = (type: string, isRead: boolean) => {
    const baseColors = {
        'chat.message': 'text-blue-500',
        'onboarding.step.completed': 'text-green-500', 
        'document.uploaded': 'text-orange-500',
        'user.created_from_applicant': 'text-purple-500'
    }
    
    const color = baseColors[type as keyof typeof baseColors] || 'text-gray-500'
    return isRead ? `${color} opacity-60` : color
}

export default function NotificationItem({ 
    notification, 
    onClick, 
    className 
}: NotificationItemProps) {
    const isRead = !!notification.readAt
    const timeAgo = formatDistance(new Date(notification.createdAt), new Date(), {
        addSuffix: true,
        locale: cs
    })

    return (
        <div
            className={cn(
                "flex items-start space-x-3 p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors",
                !isRead && "bg-blue-50/30",
                className
            )}
            onClick={onClick}
        >
            {/* Icon */}
            <div className={cn(
                "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
                isRead ? "bg-gray-100" : "bg-blue-100",
                getNotificationColor(notification.type, isRead)
            )}>
                {getNotificationIcon(notification.type)}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <h4 className={cn(
                            "text-sm font-medium text-gray-900",
                            isRead && "text-gray-600"
                        )}>
                            {notification.title}
                        </h4>
                        
                        {notification.body && (
                            <p className={cn(
                                "text-sm text-gray-600 mt-1 line-clamp-2",
                                isRead && "text-gray-500"
                            )}>
                                {notification.body}
                            </p>
                        )}
                        
                        <p className="text-xs text-gray-400 mt-2">
                            {timeAgo}
                        </p>
                    </div>

                    {/* Unread indicator */}
                    {!isRead && (
                        <div className="flex-shrink-0 w-2 h-2 bg-blue-600 rounded-full ml-2 mt-1" />
                    )}
                </div>

                {/* Type label */}
                <div className="mt-2">
                    <span className={cn(
                        "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium",
                        isRead 
                            ? "bg-gray-100 text-gray-600" 
                            : "bg-blue-100 text-blue-700"
                    )}>
                        {notification.typeLabel}
                    </span>
                </div>
            </div>
        </div>
    )
}