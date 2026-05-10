"use client"

import { useRef, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Sparkles, X, Loader2 } from "lucide-react"
import { streamRefineText } from "@/lib/api/ai-job-chat"
import toast from "react-hot-toast"

interface RefineButtonProps {
    text: string
    fieldType: "description" | "duty" | "requirement" | "benefit"
    jobTitle?: string
    onRefine: (refined: string) => void
    onStreamingChange?: (streaming: boolean) => void
    disabled?: boolean
}

export function RefineButton({
    text,
    fieldType,
    jobTitle,
    onRefine,
    onStreamingChange,
    disabled,
}: RefineButtonProps) {
    const [streaming, setStreaming] = useState(false)
    const abortRef = useRef<AbortController | null>(null)

    const handleStreaming = useCallback((value: boolean) => {
        setStreaming(value)
        onStreamingChange?.(value)
    }, [onStreamingChange])

    const handleClick = useCallback(() => {
        if (streaming) {
            abortRef.current?.abort()
            handleStreaming(false)
            return
        }

        const trimmed = text.trim()
        if (!trimmed) return

        const controller = new AbortController()
        abortRef.current = controller
        handleStreaming(true)

        let accumulated = ""

        streamRefineText(
            trimmed,
            fieldType,
            {
                onToken(token) {
                    accumulated += token
                    onRefine(accumulated)
                },
                onDone() {
                    handleStreaming(false)
                },
                onError(err) {
                    handleStreaming(false)
                    toast.error(err || "Chyba při vylepšování textu")
                },
            },
            controller.signal,
            jobTitle,
        )
    }, [text, fieldType, jobTitle, streaming, onRefine, handleStreaming])

    const isEmpty = !text.trim()

    return (
        <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClick}
            disabled={disabled || (isEmpty && !streaming)}
            className="h-7 gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
            {streaming ? (
                <>
                    <X className="h-3 w-3" />
                    Zastavit
                </>
            ) : (
                <>
                    <Sparkles className="h-3 w-3" />
                    Vylepšit
                </>
            )}
        </Button>
    )
}
