"use client"

import ProtectedRoute from "@/components/ProtectedRoute"
import { AiDataChat } from "@/components/admin/ai-data-chat/AiDataChat"

function AiDataChatPage() {
    return <AiDataChat />
}

export default function ProtectedAiDataChatPage() {
    return (
        <ProtectedRoute requiredRoles={['admin', 'super_admin']}>
            <AiDataChatPage />
        </ProtectedRoute>
    )
}
