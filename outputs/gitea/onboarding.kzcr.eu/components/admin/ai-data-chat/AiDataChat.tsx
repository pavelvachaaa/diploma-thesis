"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { ArrowUp, Square, Database, RotateCcw, Code, Loader2 } from "lucide-react"
import { useAIDataChat } from "@/hooks/useAIDataChat"
import { DataChatMessage } from "@/lib/api/ai-data-chat"
import { DataTable } from "./DataTable"
import { NumberCard } from "./NumberCard"

const SUGGESTIONS = [
    "Kolik máme uchazečů?",
    "Seznam aktivních pozic",
    "Pohovory tento týden",
    "Nejčastější pracovní role",
]

export function AiDataChat() {
    const {
        messages,
        statusMessage,
        isStreaming,
        error,
        sendMessage,
        stopStreaming,
        reset,
    } = useAIDataChat()

    const [input, setInput] = useState("")
    const bottomRef = useRef<HTMLDivElement>(null)
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" })
    }, [messages, statusMessage, isStreaming])

    useEffect(() => {
        textareaRef.current?.focus()
    }, [])

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
        sendMessage(trimmed)
        setInput("")
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

    const isEmpty = messages.length === 0 && !isStreaming

    return (
        <div className="flex flex-col h-[calc(100vh-4rem)] bg-background rounded-lg border">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b shrink-0">
                <div className="flex items-center gap-2">
                    <Database className="h-5 w-5 text-primary" />
                    <h1 className="text-lg font-semibold">AI Data Chat</h1>
                </div>
                {messages.length > 0 && (
                    <Button variant="outline" size="sm" onClick={reset}>
                        <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                        Nová konverzace
                    </Button>
                )}
            </div>

            {/* Messages area */}
            <div className="flex-1 overflow-y-auto">
                {isEmpty ? (
                    <div className="flex flex-col items-center justify-center h-full px-6">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-5">
                            <Database className="h-6 w-6 text-primary" />
                        </div>
                        <h3 className="text-lg font-semibold mb-1">Ptejte se na vaše data</h3>
                        <p className="text-sm text-muted-foreground text-center mb-8 max-w-xs">
                            Zeptejte se na cokoliv o uchazečích, pozicích, pohovorech nebo zaměstnancích.
                        </p>
                        <div className="grid grid-cols-2 gap-2 w-full max-w-sm">
                            {SUGGESTIONS.map((s) => (
                                <button
                                    key={s}
                                    onClick={() => sendMessage(s)}
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

                        {isStreaming && (
                            <div className="max-w-2xl mx-auto">
                                <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    <span>{statusMessage || "Zpracovávám dotaz..."}</span>
                                </div>
                            </div>
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
            <div className="p-4 pt-2 border-t">
                <div className="relative mx-auto max-w-2xl">
                    <div className="flex items-end gap-2 rounded-2xl border border-border bg-muted/30 px-4 py-2 focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/20 transition-all">
                        <textarea
                            ref={textareaRef}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Zeptejte se na vaše data..."
                            className="flex-1 bg-transparent border-none outline-none resize-none text-sm leading-relaxed py-1.5 placeholder:text-muted-foreground/60 max-h-[160px]"
                            rows={1}
                            disabled={isStreaming}
                        />
                        {isStreaming ? (
                            <Button
                                type="button"
                                size="icon"
                                variant="outline"
                                onClick={stopStreaming}
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

function MessageItem({ message }: { message: DataChatMessage }) {
    const [showSQL, setShowSQL] = useState(false)

    if (message.role === "user") {
        return (
            <div className="flex justify-end">
                <div className="max-w-[85%] rounded-2xl bg-primary text-primary-foreground px-4 py-2.5 text-sm leading-relaxed">
                    <p className="whitespace-pre-wrap break-words">{message.content}</p>
                </div>
            </div>
        )
    }

    return (
        <div className="max-w-2xl mx-auto space-y-3">
            {/* Explanation */}
            {message.content && (
                <div className="text-sm leading-relaxed">
                    <p className="whitespace-pre-wrap">{message.content}</p>
                </div>
            )}

            {/* Query result */}
            {message.queryResult && (
                <div className="space-y-2">
                    {message.queryResult.type === "number" ? (
                        <NumberCard
                            data={message.queryResult.data}
                            explanation={message.queryResult.explanation}
                        />
                    ) : (
                        <DataTable data={message.queryResult.data} />
                    )}

                    {/* Row count */}
                    {message.queryResult.type === "table" && message.queryResult.rowCount > 0 && (
                        <p className="text-xs text-muted-foreground">
                            {message.queryResult.rowCount} {message.queryResult.rowCount === 1 ? 'záznam' : message.queryResult.rowCount < 5 ? 'záznamy' : 'záznamů'}
                        </p>
                    )}

                    {/* Toggle SQL */}
                    {message.queryResult.sql && (
                        <div>
                            <button
                                onClick={() => setShowSQL(!showSQL)}
                                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                            >
                                <Code className="h-3 w-3" />
                                {showSQL ? "Skrýt SQL" : "Zobrazit SQL"}
                            </button>
                            {showSQL && (
                                <pre className="mt-1 p-3 rounded-md bg-muted text-xs overflow-x-auto">
                                    <code>{message.queryResult.sql}</code>
                                </pre>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
