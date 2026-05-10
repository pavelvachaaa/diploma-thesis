"use client"

import {
    Avatar, AvatarFallback
} from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { formatDistanceToNow } from 'date-fns'
import { cs } from 'date-fns/locale'
import { Paperclip, MessageSquare } from 'lucide-react'
import { ChatThread } from '@/lib/api/chat'

interface ThreadListProps {
    threads: ChatThread[]
    selectedThreadId?: string | null
    onThreadSelect: (userId: string) => void
    loading?: boolean
}

export default function ThreadList({
    threads,
    selectedThreadId,
    onThreadSelect,
    loading = false
}: ThreadListProps) {
    const getInitials = (name?: string, surname?: string, email?: string) => {
        if (name && surname) {
            return `${name[0]}${surname[0]}`.toUpperCase()
        } else if (name) {
            return name.substring(0, 2).toUpperCase()
        } else if (email) {
            return email.substring(0, 2).toUpperCase()
        }
        return 'U'
    }

    const getDisplayName = (thread: ChatThread) => {
        if (thread.peerName && thread.peerSurname) {
            return `${thread.peerName} ${thread.peerSurname}`
        } else if (thread.peerName) {
            return thread.peerName
        }
        return thread.peerEmail || 'Neznámý uživatel'
    }

    const formatMessageTime = (dateString: string) => {
        try {
            return formatDistanceToNow(new Date(dateString), {
                addSuffix: true,
                locale: cs
            })
        } catch {
            return 'před chvílí'
        }
    }

    if (loading) {
        return (
            <div className="flex-1 p-4">
                <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="flex items-center space-x-3 p-3 rounded-lg animate-pulse">
                            <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                            <div className="flex-1 space-y-2">
                                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )
    }

    if (threads.length === 0) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                <MessageSquare className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Žádné konverzace
                </h3>
                <p className="text-sm text-gray-500">
                    Začněte novou konverzaci odesláním zprávy
                </p>
            </div>
        )
    }

    return (
        <div className="flex-1 overflow-y-auto">
            <div className="p-4 space-y-2">
                {threads.map((thread) => (
                    <div
                        key={thread.peerUserId}
                        onClick={() => onThreadSelect(thread.peerUserId)}
                        className={`
                            flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-colors
                            hover:bg-gray-50 
                            ${selectedThreadId === thread.peerUserId ? 'bg-blue-50 border border-blue-200' : ''}
                        `}
                    >
                        <Avatar className="h-10 w-10">
                            <AvatarFallback>
                                {getInitials(thread.peerName, thread.peerSurname, thread.peerEmail)}
                            </AvatarFallback>
                        </Avatar>

                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                                <h4 className="text-sm font-medium text-gray-900 truncate">
                                    {getDisplayName(thread)}
                                </h4>
                                <div className="flex items-center space-x-2">
                                    {thread.unreadCount > 0 && (
                                        <Badge variant="destructive" className="text-xs px-1.5 py-0.5">
                                            {thread.unreadCount}
                                        </Badge>
                                    )}
                                    <span className="text-xs text-gray-500">
                                        {formatMessageTime(thread.lastMessage.createdAt)}
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center space-x-2">
                                <p className="text-sm text-gray-600 truncate flex-1">
                                    {thread.lastMessage.body || (
                                        <span className="italic flex items-center">
                                            <Paperclip className="h-3 w-3 mr-1" />
                                            Příloha
                                        </span>
                                    )}
                                </p>
                                {thread.lastMessage.hasAttachments && thread.lastMessage.body && (
                                    <Paperclip className="h-3 w-3 text-gray-400 flex-shrink-0" />
                                )}
                            </div>

                            {thread.peerEmail && (
                                <p className="text-xs text-gray-500 truncate mt-1">
                                    {thread.peerEmail}
                                </p>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}