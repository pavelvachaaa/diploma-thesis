"use client"

import { useMemo } from "react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { FileText, Loader2, Pen } from "lucide-react"

const SEPARATOR = "\n---\n"

/** Extract only the offer text part (before ---) from the streaming text */
function extractOfferFromStream(text: string): string {
    const idx = text.indexOf(SEPARATOR)
    return idx !== -1 ? text.slice(0, idx) : text
}

interface JobPreviewPanelProps {
    offerText: string
    currentAssistantMessage: string
    onOfferTextChange: (text: string) => void
    onAccept: () => void
    isStreaming: boolean
    isExtracting: boolean
}

export function JobPreviewPanel({
    offerText,
    currentAssistantMessage,
    onOfferTextChange,
    onAccept,
    isStreaming,
    isExtracting,
}: JobPreviewPanelProps) {
    // During streaming, show only the offer part (before ---)
    const streamingOfferText = useMemo(
        () => isStreaming ? extractOfferFromStream(currentAssistantMessage) : "",
        [isStreaming, currentAssistantMessage]
    )

    const hasContent = offerText || streamingOfferText

    if (!hasContent && !isStreaming) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-8">
                <FileText className="h-12 w-12 mb-4 opacity-30" />
                <p className="text-base font-medium">Text nabídky</p>
                <p className="text-sm mt-2 max-w-xs">
                    AI asistent vygeneruje text nabídky z vaší konverzace. Poté jej zde budete moci upravit.
                </p>
            </div>
        )
    }

    const displayText = isStreaming ? streamingOfferText : offerText
    const isEditable = !isStreaming

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center gap-2 px-4 py-3 border-b shrink-0">
                {isStreaming ? (
                    <>
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        <span className="text-sm font-medium text-primary">Generuji nabídku...</span>
                    </>
                ) : (
                    <>
                        <Pen className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-sm font-medium text-muted-foreground">Text nabídky</span>
                    </>
                )}
            </div>

            {/* Content */}
            {isEditable ? (
                <div className="flex-1 min-h-0">
                    <textarea
                        value={displayText}
                        onChange={(e) => onOfferTextChange(e.target.value)}
                        className="w-full h-full resize-none border-0 bg-transparent px-5 py-4 text-sm leading-relaxed focus:outline-none focus:ring-0 placeholder:text-muted-foreground/40"
                        placeholder="Text nabídky se zobrazí zde..."
                    />
                </div>
            ) : (
                <ScrollArea className="flex-1">
                    <div className="px-5 py-4 text-sm leading-relaxed whitespace-pre-wrap">
                        {displayText}
                        <span className="inline-block w-0.5 h-4 ml-0.5 bg-primary animate-pulse align-middle" />
                    </div>
                </ScrollArea>
            )}

            {/* Footer */}
            <div className="border-t p-4 shrink-0">
                <Button
                    type="button"
                    onClick={onAccept}
                    disabled={isStreaming || isExtracting || !offerText.trim()}
                    className="w-full bg-green-600 hover:bg-green-700"
                >
                    {isExtracting ? (
                        <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Extrahuji data nabídky...
                        </>
                    ) : (
                        "Použít nabídku"
                    )}
                </Button>
            </div>
        </div>
    )
}
