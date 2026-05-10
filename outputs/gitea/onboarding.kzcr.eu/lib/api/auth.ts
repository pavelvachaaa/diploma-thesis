import { api } from '@/lib/api'

export interface ChangePasswordRequest {
    currentPassword?: string
    newPassword: string
}

export interface ChangePasswordResponse {
    success: boolean
    message: string
}

export const changePassword = async (data: ChangePasswordRequest): Promise<ChangePasswordResponse> => {
    return api<ChangePasswordResponse>('/auth/change-password', {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    })
}