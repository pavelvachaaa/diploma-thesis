import { useState, useCallback, useRef } from 'react'
import { 
    ChatThread, 
    ChatMessage, 
    SendMessageData,
    getThreads,
    getMessages,
    sendMessage,
    markAsRead,
    downloadAttachment,
    deleteMessage,
    getAvailableUsers,
    deleteConversation,
} from '@/lib/api/chat'

export interface UseChatApiReturn {
    // Threads
    threads: ChatThread[]
    threadsLoading: boolean
    threadsError: string | null
    loadThreads: () => Promise<void>
    
    // Messages  
    messages: ChatMessage[]
    messagesLoading: boolean
    messagesError: string | null
    loadMessages: (withUserId: string, loadMore?: boolean) => Promise<void>
    sendNewMessage: (withUserId: string, data: SendMessageData) => Promise<ChatMessage | null>
    
    // Read receipts
    markMessagesAsRead: (withUserId: string, upToMessageId: string) => Promise<void>
    
    // Attachments
    downloadFile: (attachmentId: string, filename: string) => Promise<void>
    
    // Message management
    removeMessage: (messageId: string) => Promise<void>
    
    // Users (admin only)
    availableUsers: Array<{id: string, name: string, surname?: string, email: string, organization?: string}>
    usersLoading: boolean
    loadAvailableUsers: () => Promise<void>
    deleteConversationWithUser: (withUserId: string) => Promise<void>
    
    // Pagination
    hasMoreMessages: boolean
    currentConversationUserId: string | null
}

export const useChatApi = (): UseChatApiReturn => {
    // Threads state
    const [threads, setThreads] = useState<ChatThread[]>([])
    const [threadsLoading, setThreadsLoading] = useState(false)
    const [threadsError, setThreadsError] = useState<string | null>(null)
    
    // Messages state
    const [messages, setMessages] = useState<ChatMessage[]>([])
    const [messagesLoading, setMessagesLoading] = useState(false)
    const [messagesError, setMessagesError] = useState<string | null>(null)
    const [hasMoreMessages, setHasMoreMessages] = useState(true)
    const [currentConversationUserId, setCurrentConversationUserId] = useState<string | null>(null)
    
    // Users state
    const [availableUsers, setAvailableUsers] = useState<Array<{id: string, name: string, surname?: string, email: string, organization?: string}>>([])
    const [usersLoading, setUsersLoading] = useState(false)
    
    // Pagination cursor
    const messagesCursor = useRef<{ createdAt?: string, id?: string }>({})
    
    const loadThreads = useCallback(async () => {
        setThreadsLoading(true)
        setThreadsError(null)
        
        try {
            const data = await getThreads({ limit: 50 })
            setThreads(data)
        } catch (error) {
            console.error('Failed to load threads:', error)
            setThreadsError(error instanceof Error ? error.message : 'Failed to load threads')
        } finally {
            setThreadsLoading(false)
        }
    }, [])
    
    const loadMessages = useCallback(async (withUserId: string, loadMore = false) => {
        if (!loadMore) {
            setMessages([])
            messagesCursor.current = {}
            setCurrentConversationUserId(withUserId)
            setHasMoreMessages(true)
        }
        
        setMessagesLoading(true)
        setMessagesError(null)
        
        try {
            const data = await getMessages(withUserId, {
                limit: 50,
                cursorCreatedAt: messagesCursor.current.createdAt,
                cursorId: messagesCursor.current.id
            })
            
            if (loadMore) {
                setMessages(prev => [...prev, ...data])
            } else {
                setMessages(data)
            }
            
            // Update cursor for next load
            if (data.length > 0) {
                const lastMessage = data[data.length - 1]
                messagesCursor.current = {
                    createdAt: lastMessage.createdAt,
                    id: lastMessage.id
                }
            }
            
            // Check if we have more messages
            setHasMoreMessages(data.length === 50)
            
        } catch (error) {
            console.error('Failed to load messages:', error)
            setMessagesError(error instanceof Error ? error.message : 'Failed to load messages')
        } finally {
            setMessagesLoading(false)
        }
    }, [])
    
    const sendNewMessage = useCallback(async (withUserId: string, data: SendMessageData): Promise<ChatMessage | null> => {
        try {
            const newMessage = await sendMessage(withUserId, data)
            
            // Add message to current conversation if it matches
            if (currentConversationUserId === withUserId) {
                setMessages(prev => [...prev, newMessage])
            }
            
            // Update threads list - move thread to top and update last message
            setThreads(prev => {
                const existingThreadIndex = prev.findIndex(t => t.peerUserId === withUserId)
                const existingThread = existingThreadIndex >= 0 ? prev[existingThreadIndex] : null
                
                // If no existing thread, try to find user info from availableUsers
                let peerInfo = {
                    peerName: existingThread?.peerName,
                    peerSurname: existingThread?.peerSurname,
                    peerEmail: existingThread?.peerEmail
                }
                
                if (!existingThread) {
                    const userInfo = availableUsers.find(u => u.id === withUserId)
                    if (userInfo) {
                        peerInfo = {
                            peerName: userInfo.name,
                            peerSurname: userInfo.surname,
                            peerEmail: userInfo.email
                        }
                    }
                }
                
                const updatedThread: ChatThread = {
                    peerUserId: withUserId,
                    ...peerInfo,
                    lastMessage: {
                        id: newMessage.id,
                        body: newMessage.body,
                        createdAt: newMessage.createdAt,
                        hasAttachments: newMessage.attachments.length > 0,
                        senderId: newMessage.senderId
                    },
                    unreadCount: 0 // User just sent it
                }
                
                if (existingThreadIndex >= 0) {
                    // Update existing thread and move to top
                    const newThreads = [...prev]
                    newThreads.splice(existingThreadIndex, 1)
                    return [updatedThread, ...newThreads]
                } else {
                    // Add new thread at top
                    return [updatedThread, ...prev]
                }
            })
            
            return newMessage
        } catch (error) {
            console.error('Failed to send message:', error)
            throw error
        }
    }, [currentConversationUserId, availableUsers])
    
    const markMessagesAsRead = useCallback(async (withUserId: string, upToMessageId: string) => {
        try {
            await markAsRead(withUserId, upToMessageId)
            
            // Update unread count in threads immediately for responsive UI
            setThreads(prev => prev.map(thread => 
                thread.peerUserId === withUserId 
                    ? { ...thread, unreadCount: 0 }
                    : thread
            ))
            
            // Refresh threads list to ensure consistency with server
            await loadThreads()
        } catch (error) {
            console.error('Failed to mark messages as read:', error)
        }
    }, [loadThreads])
    
    const downloadFile = useCallback(async (attachmentId: string, filename: string) => {
        try {
            await downloadAttachment(attachmentId, filename)
        } catch (error) {
            console.error('Failed to download attachment:', error)
            throw error
        }
    }, [])
    
    const removeMessage = useCallback(async (messageId: string) => {
        try {
            await deleteMessage(messageId)
            
            // Remove message from current conversation
            setMessages(prev => prev.filter(msg => msg.id !== messageId))
        } catch (error) {
            console.error('Failed to delete message:', error)
            throw error
        }
    }, [])
    
    const loadAvailableUsers = useCallback(async () => {
        setUsersLoading(true)
        
        try {
            const users = await getAvailableUsers()
            setAvailableUsers(users)
        } catch (error) {
            console.error('Failed to load available users:', error)
        } finally {
            setUsersLoading(false)
        }
    }, [])
    
    const deleteConversationWithUser = useCallback(async (withUserId: string) => {
        try {
            const result = await deleteConversation(withUserId)
            
            // Remove the thread from the local state
            setThreads(prev => prev.filter(thread => thread.peerUserId !== withUserId))
            
            // If this was the current conversation, clear it
            if (currentConversationUserId === withUserId) {
                setMessages([])
                messagesCursor.current = null
                setCurrentConversationUserId(null)
            }
            
            console.log(result.message)
        } catch (error) {
            console.error('Failed to delete conversation:', error)
            throw error
        }
    }, [currentConversationUserId])
    
    return {
        // Threads
        threads,
        threadsLoading,
        threadsError,
        loadThreads,
        
        // Messages
        messages,
        messagesLoading, 
        messagesError,
        loadMessages,
        sendNewMessage,
        
        // Read receipts
        markMessagesAsRead,
        
        // Attachments
        downloadFile,
        
        // Message management
        removeMessage,
        
        // Users
        availableUsers,
        usersLoading,
        loadAvailableUsers,
        deleteConversationWithUser,
        
        // Pagination
        hasMoreMessages,
        currentConversationUserId
    }
}
