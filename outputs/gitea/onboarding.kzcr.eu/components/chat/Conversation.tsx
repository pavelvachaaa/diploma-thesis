"use client"

import React, { useEffect, useState } from 'react'
import { ArrowLeft, User, MoreVertical, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import MessageList from './MessageList'
import Composer from './Composer'
import { useChatApi } from './useChatApi'

interface ConversationProps {
    withUserId: string
    peerName?: string
    peerSurname?: string
    peerEmail?: string
    onBack?: () => void
}

export default function Conversation({
    withUserId,
    peerName,
    peerSurname, 
    peerEmail,
    onBack
}: ConversationProps) {
    const {
        messages,
        messagesLoading,
        messagesError,
        loadMessages,
        sendNewMessage,
        markMessagesAsRead,
        downloadFile,
        removeMessage,
        hasMoreMessages,
        deleteConversationWithUser
    } = useChatApi()

    const [loadingMore, setLoadingMore] = useState(false)

    // Load messages when conversation changes
    useEffect(() => {
        if (withUserId) {
            loadMessages(withUserId)
        }
    }, [withUserId, loadMessages])

    // Get display name and initials
    const getDisplayName = () => {
        if (peerName && peerSurname) {
            return `${peerName} ${peerSurname}`
        } else if (peerName) {
            return peerName
        }
        return peerEmail || 'Neznámý uživatel'
    }

    const getInitials = () => {
        if (peerName && peerSurname) {
            return `${peerName[0]}${peerSurname[0]}`.toUpperCase()
        } else if (peerName) {
            return peerName.substring(0, 2).toUpperCase()
        } else if (peerEmail) {
            return peerEmail.substring(0, 2).toUpperCase()
        }
        return 'U'
    }

    const handleSendMessage = async (data: { body?: string; files?: File[] }) => {
        try {
            await sendNewMessage(withUserId, data)
        } catch (error) {
            console.error('Failed to send message:', error)
            throw error
        }
    }

    const handleLoadMore = async () => {
        if (loadingMore) return
        
        setLoadingMore(true)
        try {
            await loadMessages(withUserId, true)
        } finally {
            setLoadingMore(false)
        }
    }

    const handleMarkAsRead = async (messageId: string) => {
        try {
            await markMessagesAsRead(withUserId, messageId)
        } catch (error) {
            console.error('Failed to mark messages as read:', error)
        }
    }

    const handleDownloadAttachment = async (attachmentId: string, filename: string) => {
        try {
            await downloadFile(attachmentId, filename)
        } catch (error) {
            console.error('Failed to download attachment:', error)
        }
    }

    const handleDeleteMessage = async (messageId: string) => {
        try {
            await removeMessage(messageId)
        } catch (error) {
            console.error('Failed to delete message:', error)
        }
    }

    const handleDeleteConversation = async () => {
        if (confirm('Opravdu chcete smazat celou konverzaci? Tato akce je nevratná.')) {
            try {
                await deleteConversationWithUser(withUserId)
                if (onBack) {
                    onBack() // Go back to conversation list
                }
            } catch (error) {
                console.error('Failed to delete conversation:', error)
                alert('Nepodařilo se smazat konverzaci. Zkuste to prosím znovu.')
            }
        }
    }

    if (messagesError) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                <div className="text-red-500 mb-4">
                    Chyba při načítání konverzace
                </div>
                <p className="text-sm text-gray-500 mb-4">
                    {messagesError}
                </p>
                <Button 
                    onClick={() => loadMessages(withUserId)}
                    variant="outline"
                >
                    Zkusit znovu
                </Button>
            </div>
        )
    }

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="border-b bg-white p-4 flex items-center space-x-3">
                {onBack && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onBack}
                        className="md:hidden flex-shrink-0"
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                )}
                
                <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-sm">
                        {getInitials()}
                    </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                    <h2 className="text-lg font-semibold text-gray-900 truncate">
                        {getDisplayName()}
                    </h2>
                    {peerEmail && (
                        <p className="text-sm text-gray-500 truncate">
                            {peerEmail}
                        </p>
                    )}
                </div>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="flex-shrink-0">
                            <MoreVertical className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem 
                            onClick={handleDeleteConversation}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Smazat konverzaci
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {/* Messages */}
            <MessageList
                messages={messages}
                loading={messagesLoading}
                hasMore={hasMoreMessages}
                onLoadMore={handleLoadMore}
                onMarkAsRead={handleMarkAsRead}
                onDownloadAttachment={handleDownloadAttachment}
                onDeleteMessage={handleDeleteMessage}
            />

            {/* Composer */}
            <Composer
                onSendMessage={handleSendMessage}
                disabled={messagesLoading}
                placeholder="Napište zprávu..."
            />
        </div>
    )
}