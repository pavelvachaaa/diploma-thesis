"use client"

import React, { useState, useEffect } from 'react'
import { MessageSquare, Users, Search, UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import ThreadList from '@/components/chat/ThreadList'
import Conversation from '@/components/chat/Conversation'
import { useChatApi } from '@/components/chat/useChatApi'
import ProtectedRoute from '@/components/ProtectedRoute'
import { ADMIN_SHELL_ROLES } from '@/lib/authorizedPersonAccess'

function AdminChatPage() {
    const {
        threads,
        threadsLoading,
        threadsError,
        loadThreads,
        availableUsers,
        usersLoading,
        loadAvailableUsers
    } = useChatApi()

    const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [showNewChat, setShowNewChat] = useState(false)

    // Load threads on mount
    useEffect(() => {
        loadThreads()
    }, [loadThreads])

    // Load available users for new conversations
    useEffect(() => {
        loadAvailableUsers()
    }, [loadAvailableUsers])

    const selectedThread = threads.find(thread => thread.peerUserId === selectedThreadId)
    
    // If no thread exists (new conversation), get user info from availableUsers
    const selectedUserInfo = selectedThread || (selectedThreadId ? availableUsers.find(user => user.id === selectedThreadId) : null)

    // Filter threads by search query
    const filteredThreads = threads.filter(thread => {
        if (!searchQuery) return true
        
        const searchLower = searchQuery.toLowerCase()
        const peerName = `${thread.peerName || ''} ${thread.peerSurname || ''}`.trim().toLowerCase()
        const peerEmail = thread.peerEmail?.toLowerCase() || ''
        
        return peerName.includes(searchLower) || peerEmail.includes(searchLower)
    })

    // Filter available users for new chat (exclude existing threads)
    const availableNewChatUsers = (availableUsers || []).filter(user => {
        return !threads.find(thread => thread.peerUserId === user.id)
    })

    const handleThreadSelect = (userId: string) => {
        setSelectedThreadId(userId)
        setShowNewChat(false)
    }

    const handleStartNewChat = (userId: string) => {
        setSelectedThreadId(userId)
        setShowNewChat(false)
    }

    const handleBackToThreads = () => {
        setSelectedThreadId(null)
        setShowNewChat(false)
    }

    return (
        <div className="h-[calc(100vh-4rem)] flex bg-white rounded-lg border overflow-hidden">
            {/* Sidebar - Threads List */}
            <div className={`
                w-full md:w-80 border-r flex flex-col
                ${selectedThreadId ? 'hidden md:flex' : 'flex'}
            `}>
                {/* Header */}
                <div className="p-4 border-b">
                    <div className="flex items-center justify-between mb-4">
                        <h1 className="text-xl font-semibold flex items-center">
                            <MessageSquare className="h-5 w-5 mr-2" />
                            Chat s uživateli
                        </h1>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowNewChat(true)}
                        >
                            <UserPlus className="h-4 w-4 mr-2" />
                            Nová konverzace
                        </Button>
                    </div>
                    
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Hledat konverzace..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </div>

                {/* Show new chat users or thread list */}
                {showNewChat ? (
                    <div className="flex-1 p-4">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-medium">Začít novou konverzaci</h3>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowNewChat(false)}
                            >
                                Zrušit
                            </Button>
                        </div>
                        
                        {/* Search for new users */}
                        <div className="relative mb-4">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Hledat uživatele..."
                                className="pl-10"
                            />
                        </div>
                        
                        {usersLoading ? (
                            <div className="text-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                            </div>
                        ) : (
                            <div className="space-y-2 max-h-96 overflow-y-auto">
                                {availableNewChatUsers.length === 0 ? (
                                    <div className="text-center py-8 text-gray-500">
                                        <Users className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                                        Všichni uživatelé již mají aktivní konverzaci
                                    </div>
                                ) : (
                                    availableNewChatUsers.map(user => (
                                        <div
                                            key={user.id}
                                            onClick={() => handleStartNewChat(user.id)}
                                            className="flex items-center space-x-3 p-3 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                                        >
                                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                                <span className="text-sm font-medium text-blue-600">
                                                    {user.name.substring(0, 2).toUpperCase()}
                                                </span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="font-medium text-gray-900">
                                                    {user.name} {user.surname}
                                                </div>
                                                <div className="text-sm text-gray-500 truncate">
                                                    {user.email}
                                                </div>
                                                {user.organization && (
                                                    <div className="text-xs text-gray-400">
                                                        {user.organization}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </div>
                ) : (
                    <ThreadList
                        threads={filteredThreads}
                        selectedThreadId={selectedThreadId}
                        onThreadSelect={handleThreadSelect}
                        loading={threadsLoading}
                    />
                )}

                {/* Error state */}
                {threadsError && (
                    <div className="p-4 text-center">
                        <div className="text-red-500 mb-2">
                            Chyba při načítání konverzací
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={loadThreads}
                        >
                            Zkusit znovu
                        </Button>
                    </div>
                )}
            </div>

            {/* Main Content - Conversation */}
            <div className={`
                flex-1 flex flex-col
                ${selectedThreadId ? 'flex' : 'hidden md:flex'}
            `}>
                {selectedThreadId ? (
                    <Conversation
                        withUserId={selectedThreadId}
                        peerName={
                            selectedThread?.peerName || 
                            (selectedUserInfo && 'name' in selectedUserInfo ? selectedUserInfo.name : undefined)
                        }
                        peerSurname={
                            selectedThread?.peerSurname || 
                            (selectedUserInfo && 'surname' in selectedUserInfo ? selectedUserInfo.surname : undefined)
                        }
                        peerEmail={
                            selectedThread?.peerEmail || 
                            (selectedUserInfo && 'email' in selectedUserInfo ? selectedUserInfo.email : undefined)
                        }
                        onBack={handleBackToThreads}
                    />
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-gray-50">
                        <MessageSquare className="h-12 w-12 text-gray-400 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                            Vyberte konverzaci
                        </h3>
                        <p className="text-sm text-gray-500 mb-4">
                            Zvolte existující konverzaci nebo začněte novou komunikaci s uživatelem
                        </p>
                        <Button
                            variant="outline"
                            onClick={() => setShowNewChat(true)}
                        >
                            <UserPlus className="h-4 w-4 mr-2" />
                            Začít novou konverzaci
                        </Button>
                    </div>
                )}
            </div>
        </div>
    )
}

export default function ProtectedAdminChatPage() {
    return (
        <ProtectedRoute requiredRoles={[...ADMIN_SHELL_ROLES]}>
            <AdminChatPage />
        </ProtectedRoute>
    )
}
