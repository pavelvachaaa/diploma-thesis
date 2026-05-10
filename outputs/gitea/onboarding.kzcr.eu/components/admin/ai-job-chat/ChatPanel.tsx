"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { ArrowUp, Square, Sparkles } from "lucide-react"
import { ChatMessage } from "@/lib/api/ai-job-chat"

interface ChatPanelProps {
    messages: ChatMessage[]
    currentAssistantMessage: string
    isStreaming: boolean
    error: string | null
    onSendMessage: (text: string) => void
    onStopStreaming: () => void
}

const SUGGESTIONS = [
    "Zdravotní sestra na JIP, plný úvazek",
    "Lékař na oddělení interny",
    "Sanitář na chirurgické oddělení",
    "Fyzioterapeut do rehabilitačního centra",
]

export function ChatPanel({
    messages,
    currentAssistantMessage,
    isStreaming,
    error,
    onSendMessage,
    onStopStreaming,
}: ChatPanelProps) {
    const [input, setInput] = useState("")
    const bottomRef = useRef<HTMLDivElement>(null)
    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const scrollContainerRef = useRef<HTMLDivElement>(null)

    // Auto-scroll on new content
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" })
    }, [messages, currentAssistantMessage, isStreaming])

    // Focus textarea on mount
    useEffect(() => {
        textareaRef.current?.focus()
    }, [])

    // Auto-resize textarea
    const adjustTextareaHeight = useCallback(() => {
        const textarea = textareaRef.current
        if (!textarea) return
        textarea.style.height = "auto"
        textarea.style.height = Math.min(textarea.scrollHeight, 160) + "px"
    }, [])

    useEffect(() => {
        adjustTextareaHeight()
    }, [input, adjustTextareaHeight])

    const handleSend = () => {
        const trimmed = input.trim()
        if (!trimmed || isStreaming) return
        onSendMessage(trimmed)
        setInput("")
        // Reset textarea height
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto"
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
    }

    const isEmpty = messages.length === 0 && !currentAssistantMessage && !isStreaming

    return (
        <div className="flex flex-col h-full bg-background">
            {/* Messages area */}
            <div ref={scrollContainerRef} className="flex-1 overflow-y-auto">
                {isEmpty ? (
                    <div className="flex flex-col items-center justify-center h-full px-6">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-5">
                            <Sparkles className="h-6 w-6 text-primary" />
                        </div>
                        <h3 className="text-lg font-semibold mb-1">Vytvořte nabídku s AI</h3>
                        <p className="text-sm text-muted-foreground text-center mb-8 max-w-xs">
                            Popište pozici a AI vám pomůže sestavit kompletní pracovní nabídku.
                        </p>
                        <div className="grid grid-cols-2 gap-2 w-full max-w-sm">
                            {SUGGESTIONS.map((s) => (
                                <button
                                    key={s}
                                    onClick={() => onSendMessage(s)}
                                    className="text-left text-sm px-3 py-2.5 rounded-xl border border-border hover:bg-muted/80 transition-colors text-muted-foreground hover:text-foreground"
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="px-4 py-6 space-y-6">
                        {messages.map((msg, i) => (
                            <MessageItem key={i} message={msg} />
                        ))}

                        {currentAssistantMessage && (
                            <MessageItem
                                message={{ role: "assistant", content: currentAssistantMessage }}
                                isStreaming
                            />
                        )}

                        {isStreaming && !currentAssistantMessage && (
                            <TypingIndicator />
                        )}

                        {error && (
                            <div className="mx-auto max-w-2xl bg-destructive/10 text-destructive px-4 py-3 rounded-lg text-sm">
                                {error}
                            </div>
                        )}

                        <div ref={bottomRef} />
                    </div>
                )}
            </div>

            {/* Input area */}
            <div className="p-4 pt-2">
                <div className="relative mx-auto max-w-2xl">
                    <div className="flex items-end gap-2 rounded-2xl border border-border bg-muted/30 px-4 py-2 focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/20 transition-all">
                        <textarea
                            ref={textareaRef}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Napište zprávu..."
                            className="flex-1 bg-transparent border-none outline-none resize-none text-sm leading-relaxed py-1.5 placeholder:text-muted-foreground/60 max-h-[160px]"
                            rows={1}
                            disabled={isStreaming}
                        />
                        {isStreaming ? (
                            <Button
                                type="button"
                                size="icon"
                                variant="outline"
                                onClick={onStopStreaming}
                                className="shrink-0 h-8 w-8 rounded-full"
                            >
                                <Square className="h-3.5 w-3.5" />
                            </Button>
                        ) : (
                            <Button
                                type="button"
                                size="icon"
                                onClick={handleSend}
                                disabled={!input.trim()}
                                className="shrink-0 h-8 w-8 rounded-full"
                            >
                                <ArrowUp className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

function TypingIndicator() {
    return (
        <div className="max-w-2xl mx-auto">
            <div className="flex items-center gap-1.5 px-1 py-2">
                <span className="w-1.5 h-1.5 rounded-full bg-foreground/30 animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-1.5 h-1.5 rounded-full bg-foreground/30 animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-1.5 h-1.5 rounded-full bg-foreground/30 animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
        </div>
    )
}

function MessageItem({
    message,
    isStreaming = false,
}: {
    message: ChatMessage
    isStreaming?: boolean
}) {
    const isUser = message.role === "user"

    if (isUser) {
        return (
            <div className="flex justify-end">
                <div className="max-w-[85%] rounded-2xl bg-primary text-primary-foreground px-4 py-2.5 text-sm leading-relaxed">
                    <p className="whitespace-pre-wrap break-words">{message.content}</p>
                </div>
            </div>
        )
    }

    return (
        <div className="max-w-2xl mx-auto">
            <div className="text-sm leading-relaxed prose-sm">
                <FormattedText text={message.content} />
                {isStreaming && (
                    <span className="inline-block w-0.5 h-4 ml-0.5 bg-foreground/70 animate-pulse align-middle" />
                )}
            </div>
        </div>
    )
}

function FormattedText({ text }: { text: string }) {
    const lines = text.split("\n")
    const elements: React.ReactNode[] = []
    let listItems: string[] = []
    let key = 0

    const flushList = () => {
        if (listItems.length > 0) {
            elements.push(
                <ul key={key++} className="my-2 ml-1 space-y-1">
                    {listItems.map((item, i) => (
                        <li key={i} className="flex gap-2">
                            <span className="text-muted-foreground mt-0.5 shrink-0">&#8226;</span>
                            <span>{formatInline(item)}</span>
                        </li>
                    ))}
                </ul>
            )
            listItems = []
        }
    }

    for (const line of lines) {
        const trimmed = line.trim()
        const listMatch = trimmed.match(/^[-*•]\s+(.+)/)
        const numberedMatch = trimmed.match(/^\d+[.)]\s+(.+)/)

        if (listMatch) {
            listItems.push(listMatch[1])
        } else if (numberedMatch) {
            listItems.push(numberedMatch[1])
        } else {
            flushList()
            if (trimmed === "") {
                elements.push(<div key={key++} className="h-2" />)
            } else {
                elements.push(
                    <p key={key++} className="my-1">
                        {formatInline(trimmed)}
                    </p>
                )
            }
        }
    }
    flushList()

    return <>{elements}</>
}

function formatInline(text: string): React.ReactNode {
    // Handle **bold** patterns
    const parts = text.split(/(\*\*[^*]+\*\*)/g)
    if (parts.length === 1) return text

    return parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**")) {
            return <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>
        }
        return part
    })
}
