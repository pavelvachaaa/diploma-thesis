"use client"

import { useState, useCallback, useRef } from "react"
import { streamDataQuery, DataChatMessage, QueryResultData, HistoryEntry } from "@/lib/api/ai-data-chat"

interface UseAIDataChatReturn {
    messages: DataChatMessage[]
    statusMessage: string
    isStreaming: boolean
    error: string | null
    sendMessage: (question: string) => void
    stopStreaming: () => void
    reset: () => void
}

export function useAIDataChat(): UseAIDataChatReturn {
    const [messages, setMessages] = useState<DataChatMessage[]>([])
    const [statusMessage, setStatusMessage] = useState("")
    const [isStreaming, setIsStreaming] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const abortControllerRef = useRef<AbortController | null>(null)

    const sendMessage = useCallback((question: string) => {
        const trimmed = question.trim()
        if (!trimmed || isStreaming) return

        setError(null)

        const userMessage: DataChatMessage = { role: "user", content: trimmed }
        setMessages(prev => [...prev, userMessage])
        setStatusMessage("")
        setIsStreaming(true)

        const controller = new AbortController()
        abortControllerRef.current = controller

        // Build history from current messages (last 10 = ~5 Q&A pairs)
        const currentMessages = messages // captured via closure from useState
        const history: HistoryEntry[] = currentMessages.slice(-10).map(msg => ({
            role: msg.role,
            content: msg.content,
            sql: msg.queryResult?.sql,
        }))

        let queryResult: QueryResultData | undefined

        streamDataQuery(
            trimmed,
            {
                onStatus(message) {
                    setStatusMessage(message)
                },
                onResult(result) {
                    queryResult = result
                },
                onDone() {
                    const assistantMessage: DataChatMessage = {
                        role: "assistant",
                        content: queryResult?.explanation || "",
                        queryResult,
                    }
                    setMessages(prev => [...prev, assistantMessage])
                    setStatusMessage("")
                    setIsStreaming(false)
                    abortControllerRef.current = null
                },
                onError(err) {
                    setStatusMessage("")
                    setError(err)
                    setIsStreaming(false)
                    abortControllerRef.current = null
                },
            },
            controller.signal,
            history,
        )
    }, [isStreaming, messages])

    const stopStreaming = useCallback(() => {
        abortControllerRef.current?.abort()
        abortControllerRef.current = null
        setIsStreaming(false)
        setStatusMessage("")
    }, [])

    const reset = useCallback(() => {
        abortControllerRef.current?.abort()
        abortControllerRef.current = null
        setMessages([])
        setStatusMessage("")
        setIsStreaming(false)
        setError(null)
    }, [])

    return {
        messages,
        statusMessage,
        isStreaming,
        error,
        sendMessage,
        stopStreaming,
        reset,
    }
}
