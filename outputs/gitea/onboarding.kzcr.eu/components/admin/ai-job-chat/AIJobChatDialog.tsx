"use client"

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog"
import { ChatPanel } from "./ChatPanel"
import { JobPreviewPanel } from "./JobPreviewPanel"
import { useAIJobChat } from "./useAIJobChat"
import { JobDraft } from "@/lib/api/ai-job-chat"

interface AIJobChatDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onAcceptJob: (job: JobDraft) => void
}

export function AIJobChatDialog({
    open,
    onOpenChange,
    onAcceptJob,
}: AIJobChatDialogProps) {
    const {
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
    } = useAIJobChat()

    const handleOpenChange = (nextOpen: boolean) => {
        if (!nextOpen) {
            reset()
        }
        onOpenChange(nextOpen)
    }

    const handleAccept = async () => {
        const draft = await extractAndAccept()
        if (draft) {
            onAcceptJob(draft)
            reset()
            onOpenChange(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-[90vw] h-[85vh] flex flex-col p-0 gap-0">
                <DialogHeader className="px-6 pt-6 pb-4 border-b shrink-0">
                    <DialogTitle>AI Asistent - Generování nabídky</DialogTitle>
                    <DialogDescription>
                        Popište pozici v konverzaci a AI vygeneruje text nabídky. Po úpravách klikněte na &quot;Použít nabídku&quot;.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-1 min-h-0">
                    {/* Left panel - Chat */}
                    <div className="flex-1 border-r flex flex-col min-h-0">
                        <ChatPanel
                            messages={messages}
                            currentAssistantMessage={currentAssistantMessage}
                            isStreaming={isStreaming}
                            error={error}
                            onSendMessage={sendMessage}
                            onStopStreaming={stopStreaming}
                        />
                    </div>

                    {/* Right panel - Offer Text */}
                    <div className="flex-1 flex flex-col min-h-0">
                        <JobPreviewPanel
                            offerText={offerText}
                            currentAssistantMessage={currentAssistantMessage}
                            onOfferTextChange={setOfferText}
                            onAccept={handleAccept}
                            isStreaming={isStreaming}
                            isExtracting={isExtracting}
                        />
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
