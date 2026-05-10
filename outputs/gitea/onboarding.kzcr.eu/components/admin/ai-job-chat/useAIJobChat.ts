"use client"

import { useState, useCallback, useRef } from "react"
import { streamAIJobChat, extractJobFromText, ChatMessage, JobDraft } from "@/lib/api/ai-job-chat"

const SEPARATOR = "\n---\n"

/** Extract only the offer text part (before ---) from a full response */
function extractOffer(text: string): string {
    const idx = text.indexOf(SEPARATOR)
    return idx !== -1 ? text.slice(0, idx).trim() : text.trim()
}

interface UseAIJobChatReturn {
    messages: ChatMessage[]
    currentAssistantMessage: string
    offerText: string
    setOfferText: (text: string) => void
    isStreaming: boolean
    isExtracting: boolean
    error: string | null
    sendMessage: (text: string) => void
    stopStreaming: () => void
    extractAndAccept: () => Promise<JobDraft | null>
    reset: () => void
}

export function useAIJobChat(): UseAIJobChatReturn {
    const [messages, setMessages] = useState<ChatMessage[]>([])
    const [currentAssistantMessage, setCurrentAssistantMessage] = useState("")
    const [offerText, setOfferText] = useState("")
    const [isStreaming, setIsStreaming] = useState(false)
    const [isExtracting, setIsExtracting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const abortControllerRef = useRef<AbortController | null>(null)

    const sendMessage = useCallback((text: string) => {
        const trimmed = text.trim()
        if (!trimmed || isStreaming) return

        setError(null)

        const userMessage: ChatMessage = { role: "user", content: trimmed }
        const updatedMessages = [...messages, userMessage]
        setMessages(updatedMessages)
        setCurrentAssistantMessage("")
        setIsStreaming(true)

        const controller = new AbortController()
        abortControllerRef.current = controller

        let accumulated = ""

        streamAIJobChat(
            updatedMessages,
            {
                onToken(token) {
                    accumulated += token
                    setCurrentAssistantMessage(accumulated)
                },
                onDone() {
                    if (accumulated) {
                        setMessages(prev => [
                            ...prev,
                            { role: "assistant", content: accumulated }
                        ])
                        // Extract offer part (before ---) if separator present
                        const offer = extractOffer(accumulated)
                        // Only update offerText if there's a substantial offer
                        if (offer.length > 200) {
                            setOfferText(offer)
                        }
                    }
                    setCurrentAssistantMessage("")
                    setIsStreaming(false)
                    abortControllerRef.current = null
                },
                onError(err) {
                    if (accumulated) {
                        setMessages(prev => [
                            ...prev,
                            { role: "assistant", content: accumulated }
                        ])
                    }
                    setCurrentAssistantMessage("")
                    setError(err)
                    setIsStreaming(false)
                    abortControllerRef.current = null
                },
            },
            controller.signal,
            offerText || undefined,
        )
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [messages, isStreaming, offerText])

    const stopStreaming = useCallback(() => {
        abortControllerRef.current?.abort()
        abortControllerRef.current = null
        setIsStreaming(false)
        setCurrentAssistantMessage(prev => {
            if (prev) {
                setMessages(msgs => [...msgs, { role: "assistant", content: prev }])
            }
            return ""
        })
    }, [])

    const extractAndAccept = useCallback(async (): Promise<JobDraft | null> => {
        if (!offerText.trim()) return null
        setIsExtracting(true)
        setError(null)
        try {
            const draft = await extractJobFromText(offerText)
            return draft
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Nepodařilo se extrahovat data nabídky')
            return null
        } finally {
            setIsExtracting(false)
        }
    }, [offerText])

    const reset = useCallback(() => {
        abortControllerRef.current?.abort()
        abortControllerRef.current = null
        setMessages([])
        setCurrentAssistantMessage("")
        setOfferText("")
        setIsStreaming(false)
        setIsExtracting(false)
        setError(null)
    }, [])

    return {
        messages,
        currentAssistantMessage,
        offerText,
        setOfferText,
        isStreaming,
        isExtracting,
        error,
        sendMessage,
        stopStreaming,
        extractAndAccept,
        reset,
    }
}
