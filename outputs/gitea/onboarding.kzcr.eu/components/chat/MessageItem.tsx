"use client"

import React from 'react'
import { format } from 'date-fns'
import { cs } from 'date-fns/locale'
import { MoreVertical, Trash2, Download, FileText, Image, File } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { 
    DropdownMenu, 
    DropdownMenuContent, 
    DropdownMenuItem, 
    DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'
import { ChatMessage, ChatAttachment } from '@/lib/api/chat'

interface MessageItemProps {
    message: ChatMessage
    isFromCurrentUser: boolean
    showTimestamp?: boolean
    onDownloadAttachment?: (attachmentId: string, filename: string) => void
    onDeleteMessage?: (messageId: string) => void
}

export default function MessageItem({
    message,
    isFromCurrentUser,
    showTimestamp = true,
    onDownloadAttachment,
    onDeleteMessage
}: MessageItemProps) {
    
    const formatMessageTime = (dateString: string) => {
        try {
            return format(new Date(dateString), 'HH:mm', { locale: cs })
        } catch {
            return ''
        }
    }

    const getAttachmentIcon = (mimeType?: string) => {
        if (!mimeType) return <File className="h-4 w-4" />
        
        if (mimeType.startsWith('image/')) {
            return <Image className="h-4 w-4" />
        } else if (mimeType.includes('pdf')) {
            return <FileText className="h-4 w-4" />
        }
        return <File className="h-4 w-4" />
    }

    const formatFileSize = (bytes?: number) => {
        if (!bytes) return ''
        
        if (bytes < 1024) return `${bytes} B`
        if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
        return `${Math.round(bytes / (1024 * 1024))} MB`
    }

    const handleDownloadAttachment = (attachment: ChatAttachment) => {
        if (onDownloadAttachment) {
            onDownloadAttachment(attachment.id, attachment.originalName)
        }
    }

    const handleDeleteMessage = () => {
        if (onDeleteMessage) {
            onDeleteMessage(message.id)
        }
    }

    return (
        <div className={`flex ${isFromCurrentUser ? 'justify-end' : 'justify-start'} group`}>
            <div className={`
                max-w-xs lg:max-w-md px-3 py-2 rounded-lg space-y-2
                ${isFromCurrentUser 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-100 text-gray-900'
                }
            `}>
                {/* Timestamp */}
                {showTimestamp && (
                    <div className={`text-xs ${isFromCurrentUser ? 'text-blue-100' : 'text-gray-500'}`}>
                        {formatMessageTime(message.createdAt)}
                        {message.editedAt && (
                            <span className="ml-1">(upraveno)</span>
                        )}
                    </div>
                )}

                {/* Message body */}
                {message.body && (
                    <div className="whitespace-pre-wrap break-words">
                        {message.body}
                    </div>
                )}

                {/* Attachments */}
                {message.attachments && message.attachments.length > 0 && (
                    <div className="space-y-2">
                        {message.attachments.map((attachment) => (
                            <div 
                                key={attachment.id}
                                className={`
                                    flex items-center space-x-2 p-2 rounded border
                                    ${isFromCurrentUser 
                                        ? 'bg-blue-400 border-blue-300' 
                                        : 'bg-white border-gray-200'
                                    }
                                    cursor-pointer hover:opacity-80 transition-opacity
                                `}
                                onClick={() => handleDownloadAttachment(attachment)}
                            >
                                {getAttachmentIcon(attachment.mimeType)}
                                <div className="flex-1 min-w-0">
                                    <div className={`text-sm font-medium truncate ${
                                        isFromCurrentUser ? 'text-white' : 'text-gray-900'
                                    }`}>
                                        {attachment.originalName}
                                    </div>
                                    {attachment.fileSize && (
                                        <div className={`text-xs ${
                                            isFromCurrentUser ? 'text-blue-100' : 'text-gray-500'
                                        }`}>
                                            {formatFileSize(attachment.fileSize)}
                                        </div>
                                    )}
                                </div>
                                <Download className={`h-4 w-4 ${
                                    isFromCurrentUser ? 'text-white' : 'text-gray-500'
                                }`} />
                            </div>
                        ))}
                    </div>
                )}

                {/* Message actions (only for current user) */}
                {isFromCurrentUser && onDeleteMessage && (
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex justify-end">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0 text-blue-100 hover:text-white hover:bg-blue-400"
                                >
                                    <MoreVertical className="h-3 w-3" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                    onClick={handleDeleteMessage}
                                    className="text-red-600 hover:text-red-700 focus:text-red-700"
                                >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Smazat zprávu
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                )}
            </div>
        </div>
    )
}