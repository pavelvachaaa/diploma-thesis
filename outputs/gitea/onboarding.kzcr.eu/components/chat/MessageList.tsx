"use client"

import React, { useEffect, useRef, useState } from 'react'
import { format, isToday, isYesterday, differenceInMinutes } from 'date-fns'
import { cs } from 'date-fns/locale'
import { ChevronUp, Loader2, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ChatMessage } from '@/lib/api/chat'
import { useAuth } from '@/context/AuthContext'
import MessageItem from './MessageItem'

interface MessageListProps {
    messages: ChatMessage[]
    loading?: boolean
    hasMore?: boolean
    onLoadMore?: () => void
    onMarkAsRead?: (messageId: string) => void
    onDownloadAttachment?: (attachmentId: string, filename: string) => void
    onDeleteMessage?: (messageId: string) => void
}

export default function MessageList({
    messages,
    loading = false,
    hasMore = false,
    onLoadMore,
    onMarkAsRead,
    onDownloadAttachment,
    onDeleteMessage
}: MessageListProps) {
    const { userId } = useAuth()
    const scrollContainerRef = useRef<HTMLDivElement>(null)
    const [shouldAutoScroll, setShouldAutoScroll] = useState(true)
    const lastMessageRef = useRef<HTMLDivElement>(null)
    const prevMessagesLengthRef = useRef(0)

    // Group messages by day
    const groupedMessages = React.useMemo(() => {
        const groups: Array<{ date: string; messages: ChatMessage[] }> = []
        
        messages.forEach((message) => {
            const messageDate = new Date(message.createdAt)
            let dateLabel: string
            
            if (isToday(messageDate)) {
                dateLabel = 'Dnes'
            } else if (isYesterday(messageDate)) {
                dateLabel = 'Včera'
            } else {
                dateLabel = format(messageDate, 'd. MMMM yyyy', { locale: cs })
            }
            
            const existingGroup = groups.find(group => group.date === dateLabel)
            if (existingGroup) {
                existingGroup.messages.push(message)
            } else {
                groups.push({ date: dateLabel, messages: [message] })
            }
        })
        
        return groups
    }, [messages])

    // Check if we should show timestamp between messages
    const shouldShowTimestamp = (currentMessage: ChatMessage, previousMessage?: ChatMessage) => {
        if (!previousMessage) return true
        
        const currentTime = new Date(currentMessage.createdAt)
        const previousTime = new Date(previousMessage.createdAt)
        const diffMinutes = differenceInMinutes(currentTime, previousTime)
        
        return diffMinutes > 5 || currentMessage.senderId !== previousMessage.senderId
    }

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        if (shouldAutoScroll && messages.length > prevMessagesLengthRef.current) {
            lastMessageRef.current?.scrollIntoView({ behavior: 'smooth' })
        }
        prevMessagesLengthRef.current = messages.length
    }, [messages, shouldAutoScroll])

    // Handle scroll to detect if user is at bottom
    const handleScroll = () => {
        const container = scrollContainerRef.current
        if (!container) return

        const { scrollTop, scrollHeight, clientHeight } = container
        const isNearBottom = scrollHeight - scrollTop - clientHeight < 100
        setShouldAutoScroll(isNearBottom)
    }

    // Mark latest message as read when it becomes visible
    // Use a ref to track the last marked message to prevent infinite loops
    const lastMarkedMessageRef = useRef<string | null>(null)
    
    // Reset the last marked message when messages array is reset (conversation change)
    useEffect(() => {
        if (messages.length === 0) {
            lastMarkedMessageRef.current = null
        }
    }, [messages])
    
    useEffect(() => {
        if (messages.length > 0 && onMarkAsRead) {
            // Find the latest unread message from peer (not current user)
            const unreadMessagesFromPeer = messages.filter(msg => msg.senderId !== userId)
            
            if (unreadMessagesFromPeer.length > 0) {
                const latestUnreadFromPeer = unreadMessagesFromPeer[unreadMessagesFromPeer.length - 1]
                
                // Only mark as read if we haven't already marked this message
                if (latestUnreadFromPeer.id !== lastMarkedMessageRef.current) {
                    console.log('Marking message as read:', latestUnreadFromPeer.id, 'from sender:', latestUnreadFromPeer.senderId)
                    lastMarkedMessageRef.current = latestUnreadFromPeer.id
                    onMarkAsRead(latestUnreadFromPeer.id)
                }
            }
        }
    }, [messages, userId, onMarkAsRead])

    if (messages.length === 0 && !loading) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                <MessageSquare className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Žádné zprávy
                </h3>
                <p className="text-sm text-gray-500">
                    Odešlete první zprávu a začněte konverzaci
                </p>
            </div>
        )
    }

    return (
        <div 
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto p-4 space-y-4"
        >
            {/* Load more button */}
            {hasMore && (
                <div className="flex justify-center">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onLoadMore}
                        disabled={loading}
                        className="flex items-center space-x-2"
                    >
                        {loading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <ChevronUp className="h-4 w-4" />
                        )}
                        <span>Načíst další zprávy</span>
                    </Button>
                </div>
            )}

            {/* Messages grouped by day */}
            {groupedMessages.map((group, groupIndex) => (
                <div key={group.date}>
                    {/* Date separator */}
                    <div className="flex justify-center my-6">
                        <div className="bg-gray-100 px-3 py-1 rounded-full text-xs text-gray-500">
                            {group.date}
                        </div>
                    </div>

                    {/* Messages for this day */}
                    <div className="space-y-2">
                        {group.messages.map((message, messageIndex) => {
                            const previousMessage = messageIndex > 0 
                                ? group.messages[messageIndex - 1] 
                                : groupIndex > 0 
                                    ? groupedMessages[groupIndex - 1].messages[groupedMessages[groupIndex - 1].messages.length - 1]
                                    : undefined
                            
                            const showTimestamp = shouldShowTimestamp(message, previousMessage)
                            const isLastMessage = groupIndex === groupedMessages.length - 1 && 
                                                messageIndex === group.messages.length - 1

                            return (
                                <div key={message.id} ref={isLastMessage ? lastMessageRef : undefined}>
                                    <MessageItem
                                        message={message}
                                        isFromCurrentUser={message.senderId === userId}
                                        showTimestamp={showTimestamp}
                                        onDownloadAttachment={onDownloadAttachment}
                                        onDeleteMessage={onDeleteMessage}
                                    />
                                </div>
                            )
                        })}
                    </div>
                </div>
            ))}
        </div>
    )
}