"use client"

import React, { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Send, Paperclip, X, File, Image, FileText } from 'lucide-react'
import { toast } from 'react-hot-toast'

interface ComposerProps {
    onSendMessage: (data: { body?: string; files?: File[] }) => Promise<void>
    disabled?: boolean
    placeholder?: string
}

export default function Composer({
    onSendMessage,
    disabled = false,
    placeholder = "Napište zprávu..."
}: ComposerProps) {
    const [message, setMessage] = useState('')
    const [attachedFiles, setAttachedFiles] = useState<File[]>([])
    const [sending, setSending] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(event.target.files || [])
        
        // Validate file count (max 5)
        if (attachedFiles.length + files.length > 5) {
            toast.error('Můžete přiložit maximálně 5 souborů')
            return
        }

        // Validate file sizes (max 10MB each)
        const maxSize = 10 * 1024 * 1024 // 10MB
        const oversizedFiles = files.filter(file => file.size > maxSize)
        if (oversizedFiles.length > 0) {
            toast.error('Některé soubory jsou příliš velké (max 10MB)')
            return
        }

        setAttachedFiles(prev => [...prev, ...files])
        
        // Clear input
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
    }

    const removeFile = (index: number) => {
        setAttachedFiles(prev => prev.filter((_, i) => i !== index))
    }

    const handleSend = async () => {
        if (!message.trim() && attachedFiles.length === 0) {
            return
        }

        setSending(true)
        try {
            await onSendMessage({
                body: message.trim() || undefined,
                files: attachedFiles.length > 0 ? attachedFiles : undefined
            })

            // Clear form
            setMessage('')
            setAttachedFiles([])
            
            // Focus back to textarea
            textareaRef.current?.focus()
        } catch (error) {
            console.error('Failed to send message:', error)
            toast.error('Nepodařilo se odeslat zprávu')
        } finally {
            setSending(false)
        }
    }

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
    }

    const getFileIcon = (file: File) => {
        if (file.type.startsWith('image/')) {
            return <Image className="h-4 w-4" />
        } else if (file.type.includes('pdf')) {
            return <FileText className="h-4 w-4" />
        }
        return <File className="h-4 w-4" />
    }

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return `${bytes} B`
        if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
        return `${Math.round(bytes / (1024 * 1024))} MB`
    }

    return (
        <div className="border-t bg-white p-4">
            {/* Attached files preview */}
            {attachedFiles.length > 0 && (
                <div className="mb-3 space-y-2">
                    {attachedFiles.map((file, index) => (
                        <div 
                            key={`${file.name}-${index}`}
                            className="flex items-center space-x-2 bg-gray-50 p-2 rounded border"
                        >
                            {getFileIcon(file)}
                            <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium truncate">
                                    {file.name}
                                </div>
                                <div className="text-xs text-gray-500">
                                    {formatFileSize(file.size)}
                                </div>
                            </div>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeFile(index)}
                                className="h-6 w-6 p-0 text-gray-400 hover:text-red-600"
                            >
                                <X className="h-3 w-3" />
                            </Button>
                        </div>
                    ))}
                </div>
            )}

            {/* Input area */}
            <div className="flex items-end space-x-3">
                <div className="flex-1">
                    <Textarea
                        ref={textareaRef}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyDown={handleKeyPress}
                        placeholder={placeholder}
                        rows={1}
                        disabled={disabled || sending}
                        className="min-h-[40px] max-h-32 resize-none"
                    />
                </div>
                
                {/* File attachment button */}
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={disabled || sending}
                    className="flex-shrink-0"
                >
                    <Paperclip className="h-4 w-4" />
                </Button>

                {/* Send button */}
                <Button
                    onClick={handleSend}
                    disabled={disabled || sending || (!message.trim() && attachedFiles.length === 0)}
                    size="sm"
                    className="flex-shrink-0"
                >
                    <Send className="h-4 w-4" />
                </Button>
            </div>

            {/* Hidden file input */}
            <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.jpg,.jpeg,.png,.gif"
                onChange={handleFileSelect}
                className="hidden"
            />

            {/* File size info */}
            <div className="mt-2 text-xs text-gray-500">
                Můžete přiložit až 5 souborů (max. 10MB každý). Podporované formáty: PDF, DOC, XLS, obrázky.
            </div>
        </div>
    )
}