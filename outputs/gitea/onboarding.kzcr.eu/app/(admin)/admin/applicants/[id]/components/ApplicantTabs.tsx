import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
    FileText,
    CheckCircle,
    XCircle,
    Clock,
    Download,
    Eye,
    AlertTriangle,
} from "lucide-react"
import { type StatusHistoryEntry, type Attachment, type ApplicantNote, type DocumentStatus, type CVAnalysis } from "@/lib/api/applicants"
import CVAnalysisTab from "./CVAnalysisTab"

interface ApplicantTabsProps {
    attachments: Attachment[]
    statusHistory: StatusHistoryEntry[]
    notes: ApplicantNote[]
    readOnly?: boolean
    canManageNotes?: boolean
    canManageAttachmentStatus?: boolean
    newNote: string
    setNewNote: (value: string) => void
    isAddingNote: boolean
    handleAddNote: () => Promise<void>
    handleDownloadAttachment: (attachmentId: string, filename: string) => void
    handleUpdateAttachmentStatus: (attachmentId: string, status: string, notes?: string) => Promise<void>
    documentStatuses: DocumentStatus[]
    getStatusDisplayName: (status: string) => string
    getStatusBadgeClass: (status: string) => string
    formatDate: (dateString: string) => string
    formatFileSize: (bytes: number) => string
    cvAnalysis?: CVAnalysis | null
    isCVAnalysisLoading?: boolean
    onReanalyze?: () => void
    isReanalyzing?: boolean
}

export default function ApplicantTabs({
    attachments,
    statusHistory,
    notes,
    readOnly = false,
    canManageNotes = false,
    canManageAttachmentStatus = false,
    newNote,
    setNewNote,
    isAddingNote,
    handleAddNote,
    handleDownloadAttachment,
    handleUpdateAttachmentStatus,
    documentStatuses,
    getStatusDisplayName,
    getStatusBadgeClass,
    formatDate,
    formatFileSize,
    cvAnalysis,
    isCVAnalysisLoading,
    onReanalyze,
    isReanalyzing
}: ApplicantTabsProps) {
    const getStatusIcon = (status: string) => {
        switch (status) {
            case "approved":
                return <CheckCircle className="h-4 w-4 text-green-500" />
            case "rejected":
                return <XCircle className="h-4 w-4 text-red-500" />
            case "in_review":
                return <Eye className="h-4 w-4 text-blue-500" />
            case "needs_revision":
                return <AlertTriangle className="h-4 w-4 text-orange-500" />
            case "pending":
            default:
                return <Clock className="h-4 w-4 text-amber-500" />
        }
    };

    const getStatusBadge = (attachment: Attachment) => {
        const statusColor = attachment.status_color || "text-amber-700 bg-amber-50 border-amber-200";
        return (
            <Badge variant="outline" className={statusColor}>
                <span className="flex items-center gap-1">
                    {getStatusIcon(attachment.status)}
                    {attachment.status_description || attachment.status}
                </span>
            </Badge>
        );
    };

    return (
        <Card className="md:col-span-2">
            <CardHeader>
                <CardTitle>Detail přihlášky</CardTitle>
            </CardHeader>
            <CardContent>
                <Tabs defaultValue="documents">
                    <TabsList className="mb-4">
                        <TabsTrigger value="documents">Dokumenty</TabsTrigger>
                        <TabsTrigger value="history">Historie statusů</TabsTrigger>
                        <TabsTrigger value="notes">Poznámky</TabsTrigger>
                        {onReanalyze && <TabsTrigger value="cv-analysis">AI Analýza</TabsTrigger>}
                    </TabsList>

                    <TabsContent value="documents" className="space-y-4">
                        <div className="rounded-md border">
                            <div className="p-4">
                                <h3 className="font-medium">Nahrané dokumenty</h3>
                                <p className="text-sm text-muted-foreground">Dokumenty nahrané uchazečem jako součást přihlášky.</p>
                            </div>
                            <div className="border-t">
                                {attachments.length > 0 ? (
                                    attachments.map((attachment) => (
                                        <div key={attachment.id} className="border-b p-4 last:border-b-0">
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex items-center gap-3 flex-1">
                                                    <FileText className="h-5 w-5 text-blue-600 flex-shrink-0" />
                                                    <div className="flex-1">
                                                        <p className="font-medium">{attachment.original_filename}</p>
                                                        <p className="text-xs text-muted-foreground">
                                                            Nahráno: {formatDate(attachment.uploaded_at)} • {formatFileSize(attachment.file_size)}
                                                        </p>
                                                        {attachment.reviewed_at && (
                                                            <p className="text-xs text-muted-foreground">
                                                                Zkontroloval: {attachment.reviewed_by_name} {attachment.reviewed_by_surname} • {formatDate(attachment.reviewed_at)}
                                                            </p>
                                                        )}
                                                        {attachment.review_notes && (
                                                            <p className="text-xs text-muted-foreground mt-1 italic">
                                                                &quot;{attachment.review_notes}&quot;
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 flex-shrink-0">
                                                    {getStatusBadge(attachment)}
                                                    <Button 
                                                        variant="ghost" 
                                                        size="sm" 
                                                        onClick={() => handleDownloadAttachment(attachment.id, attachment.original_filename)}
                                                    >
                                                        <Download className="h-4 w-4" />
                                                        <span className="sr-only">Stáhnout</span>
                                                    </Button>
                                                </div>
                                            </div>
                                            <div className="mt-3 flex gap-2 items-center">
                                                {canManageAttachmentStatus && (
                                                    <Select 
                                                        value={attachment.status} 
                                                        onValueChange={(value) => handleUpdateAttachmentStatus(attachment.id, value)}
                                                    >
                                                        <SelectTrigger className="w-48">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {documentStatuses.map((status) => (
                                                                <SelectItem key={status.name} value={status.name}>
                                                                    <div className="flex items-center gap-2">
                                                                        {getStatusIcon(status.name)}
                                                                        {status.description}
                                                                    </div>
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-8">
                                        <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                                        <p className="text-muted-foreground">Žádné dokumenty nebyly nahrány</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="history" className="space-y-4">
                        <div className="space-y-4">
                            {statusHistory.length > 0 ? (
                                <div className="space-y-4">
                                    {statusHistory.map((entry, index) => (
                                        <div key={entry.id} className="flex gap-4 p-4 rounded-lg border bg-card">
                                            <div className="flex flex-col items-center">
                                                <div className={`w-3 h-3 rounded-full ${getStatusBadgeClass(entry.status_name).replace('bg-', 'bg-').replace('text-', 'border-')} border-2`} />
                                                {index < statusHistory.length - 1 && (
                                                    <div className="w-px h-8 bg-border mt-2" />
                                                )}
                                            </div>
                                            <div className="flex-1 space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <Badge variant="outline" className={getStatusBadgeClass(entry.status_name)}>
                                                        {getStatusDisplayName(entry.status_name)}
                                                    </Badge>
                                                    <div className="text-xs text-muted-foreground">
                                                        {formatDate(entry.changed_at)}
                                                    </div>
                                                </div>
                                                {entry.notes && (
                                                    <p className="text-sm text-muted-foreground">{entry.notes}</p>
                                                )}
                                                {(entry.changed_by_name || entry.changed_by_surname) && (
                                                    <p className="text-xs text-muted-foreground">
                                                        Změněno uživatelem: {entry.changed_by_name} {entry.changed_by_surname}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <Clock className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                                    <p className="text-muted-foreground">Žádná historie statusů není k dispozici</p>
                                </div>
                            )}
                        </div>
                    </TabsContent>

                    <TabsContent value="notes" className="space-y-4">
                        <div className="rounded-md border">
                            <div className="p-4">
                                <h3 className="font-medium">Poznámky k uchazeči</h3>
                                <p className="text-sm text-muted-foreground">
                                    Interní poznámky k uchazeči viditelné pouze pro HR tým.
                                </p>
                            </div>
                            <div className="border-t">
                                {notes.length > 0 ? (
                                    <div className="divide-y">
                                        {notes.map((note) => (
                                            <div key={note.id} className="p-4">
                                                <div className="flex items-start justify-between gap-4">
                                                    <div className="flex-1">
                                                        <p className="text-sm whitespace-pre-wrap">{note.note}</p>
                                                        <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                                                            <span>
                                                                {note.author_name && note.author_surname 
                                                                    ? `${note.author_name} ${note.author_surname}` 
                                                                    : note.author_email
                                                                        ? note.author_email
                                                                    : 'Neznámý autor'}
                                                            </span>
                                                            <span>•</span>
                                                            <span>{formatDate(note.created_at)}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8">
                                        <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                                        <p className="text-muted-foreground">Žádné poznámky nebyly přidány</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {canManageNotes && (
                            <div className="rounded-md border p-4">
                                <h3 className="mb-2 font-medium">Přidat poznámku</h3>
                                <Textarea 
                                    placeholder="Zadejte novou poznámku..." 
                                    className="mb-4" 
                                    value={newNote}
                                    onChange={(e) => setNewNote(e.target.value)}
                                />
                                <Button 
                                    onClick={handleAddNote} 
                                    disabled={isAddingNote || !newNote.trim()}
                                >
                                    {isAddingNote ? "Přidávání..." : "Přidat poznámku"}
                                </Button>
                            </div>
                        )}
                    </TabsContent>

                    {onReanalyze && (
                        <TabsContent value="cv-analysis" className="space-y-4">
                            <CVAnalysisTab
                                cvAnalysis={cvAnalysis ?? null}
                                isLoading={isCVAnalysisLoading ?? false}
                                onReanalyze={onReanalyze}
                                isReanalyzing={isReanalyzing ?? false}
                            />
                        </TabsContent>
                    )}
                </Tabs>
            </CardContent>
        </Card>
    )
}
