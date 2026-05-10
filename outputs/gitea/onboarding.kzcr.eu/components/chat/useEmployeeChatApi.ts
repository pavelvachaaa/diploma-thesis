import { useState, useCallback } from 'react'
import { getAvailableHRUsers } from '@/lib/api/chat'

export interface UseEmployeeChatApiReturn {
    availableHRUsers: Array<{id: string, name: string, surname?: string, email: string, organization?: string}>
    hrUsersLoading: boolean
    loadAvailableHRUsers: () => Promise<void>
}

export function useEmployeeChatApi(): UseEmployeeChatApiReturn {
    const [availableHRUsers, setAvailableHRUsers] = useState<Array<{id: string, name: string, surname?: string, email: string, organization?: string}>>([])
    const [hrUsersLoading, setHRUsersLoading] = useState(false)

    const loadAvailableHRUsers = useCallback(async () => {
        setHRUsersLoading(true)
        
        try {
            const hrUsers = await getAvailableHRUsers()
            setAvailableHRUsers(hrUsers)
        } catch (error) {
            console.error('Failed to load available HR users:', error)
        } finally {
            setHRUsersLoading(false)
        }
    }, [])

    return {
        availableHRUsers,
        hrUsersLoading,
        loadAvailableHRUsers
    }
}