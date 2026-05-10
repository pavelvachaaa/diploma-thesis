"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
    CheckCircle,
    XCircle,
    Clock,
    Download,
    FileText,
    RotateCcw,
    AlertCircle,
    Upload
} from "lucide-react"
import toast from "react-hot-toast"
import {
    getEmployeeDocuments,
    updateDocumentStatus,
    downloadEmployeeDocument,
    uploadDocumentForEmployee,
    type UserDocument
} from "@/lib/api/employee-documents"

interface DocumentApprovalSectionProps {
    employeeId: string
}

export default function DocumentApprovalSection({ employeeId }: DocumentApprovalSectionProps) {
    const [documents, setDocuments] = useState<UserDocument[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const [uploadingDocId, setUploadingDocId] = useState<string | null>(null)

    // Dialog state for status updates
    const [selectedDocument, setSelectedDocument] = useState<UserDocument | null>(null)
    const [dialogAction, setDialogAction] = useState<'approve' | 'reject' | 'reset' | null>(null)
    const [notes, setNotes] = useState('')
    const [isUpdating, setIsUpdating] = useState(false)

    useEffect(() => {
        fetchDocuments()
    }, [employeeId])

    const fetchDocuments = async () => {
        try {
            setLoading(true)
            setError(null)
            const docs = await getEmployeeDocuments(employeeId)
            setDocuments(docs)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Nepodařilo se načíst dokumenty')
        } finally {
            setLoading(false)
        }
    }

    const handleStatusUpdate = async () => {
        if (!selectedDocument || !dialogAction) return

        try {
            setIsUpdating(true)

            const status = dialogAction === 'approve' ? 'approved' :
                          dialogAction === 'reject' ? 'rejected' : 'pending'

            await updateDocumentStatus(selectedDocument.id, {
                status,
                notes: notes.trim() || undefined
            })

            toast.success(`Dokument byl ${getActionLabel(dialogAction)}`)

            setSelectedDocument(null)
            setDialogAction(null)
            setNotes('')
            await fetchDocuments()
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Nepodařilo se aktualizovat stav dokumentu')
        } finally {
            setIsUpdating(false)
        }
    }

    const handleDownload = async (document: UserDocument) => {
        try {
            await downloadEmployeeDocument(employeeId, document.document_id, document.original_name)
            toast.success('Dokument byl stažen')
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Nepodařilo se stáhnout dokument')
        }
    }

    const openStatusDialog = (document: UserDocument, action: 'approve' | 'reject' | 'reset') => {
        setSelectedDocument(document)
        setDialogAction(action)
        setNotes('')
    }

    const handleUploadForEmployee = async (documentId: string, file: File) => {
        setUploadingDocId(documentId)
        try {
            await uploadDocumentForEmployee(employeeId, documentId, file)
            toast.success('Dokument byl úspěšně nahrán')
            await fetchDocuments()
        } catch {
            toast.error('Nepodařilo se nahrát dokument')
        } finally {
            setUploadingDocId(null)
        }
    }

    const getStatusIcon = (document: UserDocument) => {
        if (!document.file_path) return <Clock className="h-4 w-4 text-amber-500" />
        switch (document.status) {
            case 'approved': return <CheckCircle className="h-4 w-4 text-emerald-500" />
            case 'rejected': return <XCircle className="h-4 w-4 text-rose-500" />
            default: return <Clock className="h-4 w-4 text-slate-400" />
        }
    }

    const getStatusBadge = (document: UserDocument) => {
        if (!document.file_path) {
            return <Badge className="bg-amber-50 text-amber-700 border border-amber-200">Čeká na nahrání</Badge>
        }
        switch (document.status) {
            case 'approved': return <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-100">Schváleno</Badge>
            case 'rejected': return <Badge className="bg-rose-50 text-rose-700 border border-rose-100">Zamítnuto</Badge>
            default: return <Badge className="bg-slate-100 text-slate-600 border border-slate-200">Čeká na schválení</Badge>
        }
    }

    const getCardBorderClass = (document: UserDocument) => {
        if (!document.file_path) return 'border-l-4 border-l-amber-300 border border-amber-200 bg-amber-50/20'
        switch (document.status) {
            case 'approved': return 'border-l-4 border-l-emerald-300 border border-slate-100 bg-emerald-50/20'
            case 'rejected': return 'border-l-4 border-l-rose-300 border border-slate-100 bg-rose-50/20'
            default: return 'border-l-4 border-l-slate-300 border border-slate-100 bg-white'
        }
    }

    const getActionLabel = (action: string) => {
        switch (action) {
            case 'approve': return 'schválen'
            case 'reject': return 'zamítnut'
            case 'reset': return 'resetován na čekající'
            default: return 'aktualizován'
        }
    }

    const getDialogTitle = () => {
        if (!dialogAction || !selectedDocument) return ''
        switch (dialogAction) {
            case 'approve': return `Schválit dokument: ${selectedDocument.document_name}`
            case 'reject': return `Zamítnout dokument: ${selectedDocument.document_name}`
            case 'reset': return `Resetovat stav dokumentu: ${selectedDocument.document_name}`
            default: return 'Aktualizovat dokument'
        }
    }

    const getDialogDescription = () => {
        switch (dialogAction) {
            case 'approve': return 'Dokument bude označen jako schválený. Zaměstnanec bude informován o schválení.'
            case 'reject': return 'Dokument bude označen jako zamítnutý. Doporučujeme přidat poznámku s důvodem zamítnutí.'
            case 'reset': return 'Dokument bude resetován na stav "čeká na schválení".'
            default: return ''
        }
    }

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Onboardingové dokumenty
                    </CardTitle>
                    <CardDescription>
                        Dokumenty nahrané zaměstnancem během onboardingu
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
                        <p>Načítání dokumentů...</p>
                    </div>
                </CardContent>
            </Card>
        )
    }

    if (error) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Onboardingové dokumenty
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8">
                        <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-4" />
                        <p className="text-red-600 mb-4">{error}</p>
                        <Button onClick={fetchDocuments} variant="outline">
                            Zkusit znovu
                        </Button>
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Onboardingové dokumenty
                        {documents.length > 0 && (
                            <Badge variant="outline">{documents.length}</Badge>
                        )}
                    </CardTitle>
                    <CardDescription>
                        Dokumenty požadované onboardingovým workflow — nahrané zaměstnancem nebo HR
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {documents.length === 0 ? (
                        <div className="text-center py-8">
                            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-muted-foreground">Žádné dokumenty</h3>
                            <p className="text-muted-foreground">
                                Přiřazený onboardingový workflow neobsahuje žádné požadované dokumenty.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {documents.map((document) => (
                                <div
                                    key={document.id ?? document.document_id}
                                    className={`rounded-lg p-4 ${getCardBorderClass(document)}`}
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        {/* Left: doc info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-3 mb-1.5">
                                                {getStatusIcon(document)}
                                                <h4 className="font-medium text-gray-900">{document.document_name}</h4>
                                                {document.required && (
                                                    <Badge variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200 flex-shrink-0">
                                                        Povinný
                                                    </Badge>
                                                )}
                                            </div>

                                            <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
                                                {getStatusBadge(document)}
                                                {document.uploaded_at && (
                                                    <span>Nahrán: {new Date(document.uploaded_at).toLocaleDateString('cs-CZ')}</span>
                                                )}
                                                {document.document_type && (
                                                    <span>Typ: {document.document_type}</span>
                                                )}
                                            </div>

                                            {document.description && (
                                                <p className="text-sm text-muted-foreground mt-1">
                                                    {document.description}
                                                </p>
                                            )}

                                            {/* Rejection notes */}
                                            {document.status === 'rejected' && document.review_notes && (
                                                <p className="text-xs text-red-600 mt-1.5">
                                                    Důvod: {document.review_notes}
                                                </p>
                                            )}
                                        </div>

                                        {/* Right: actions */}
                                        <div className="flex items-center gap-2 flex-wrap flex-shrink-0">
                                            {/* Upload CTA — prominent when no file, subtle when file exists */}
                                            {!document.file_path ? (
                                                <label
                                                    className={`cursor-pointer inline-flex items-center gap-2 rounded-md border-2 border-dashed border-amber-300 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-700 hover:bg-amber-100 transition-colors ${uploadingDocId === document.document_id ? 'opacity-50 pointer-events-none' : ''}`}
                                                    title="Nahrát dokument za zaměstnance"
                                                >
                                                    <input
                                                        type="file"
                                                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                                        className="hidden"
                                                        disabled={uploadingDocId === document.document_id}
                                                        onChange={async (e) => {
                                                            const file = e.target.files?.[0]
                                                            if (file) {
                                                                await handleUploadForEmployee(document.document_id, file)
                                                                e.target.value = ''
                                                            }
                                                        }}
                                                    />
                                                    {uploadingDocId === document.document_id ? (
                                                        <>
                                                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-amber-700 border-t-transparent" />
                                                            Nahrávám...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Upload className="h-4 w-4" />
                                                            Nahrát za zaměstnance
                                                        </>
                                                    )}
                                                </label>
                                            ) : (
                                                <label
                                                    className={`cursor-pointer inline-flex items-center justify-center rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 w-8 transition-colors ${uploadingDocId === document.document_id ? 'opacity-50 pointer-events-none' : ''}`}
                                                    title="Nahrát dokument znovu"
                                                >
                                                    <input
                                                        type="file"
                                                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                                        className="hidden"
                                                        disabled={uploadingDocId === document.document_id}
                                                        onChange={async (e) => {
                                                            const file = e.target.files?.[0]
                                                            if (file) {
                                                                await handleUploadForEmployee(document.document_id, file)
                                                                e.target.value = ''
                                                            }
                                                        }}
                                                    />
                                                    {uploadingDocId === document.document_id ? (
                                                        <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                                    ) : (
                                                        <RotateCcw className="h-3 w-3" />
                                                    )}
                                                </label>
                                            )}

                                            {/* Download */}
                                            {document.file_path && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleDownload(document)}
                                                    className="h-8 w-8 p-0"
                                                >
                                                    <Download className="h-4 w-4" />
                                                </Button>
                                            )}

                                            {/* Approve / Reject / Reset */}
                                            {document.file_path && (
                                                <>
                                                    {document.status !== 'approved' && (
                                                        <Button
                                                            size="sm"
                                                            onClick={() => openStatusDialog(document, 'approve')}
                                                            className="bg-indigo-600 hover:bg-indigo-700 text-white"
                                                        >
                                                            <CheckCircle className="h-4 w-4 mr-1" />
                                                            Schválit
                                                        </Button>
                                                    )}

                                                    {document.status !== 'rejected' && (
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => openStatusDialog(document, 'reject')}
                                                            className="text-slate-600 border-slate-200 hover:border-rose-300 hover:text-rose-600 hover:bg-rose-50"
                                                        >
                                                            <XCircle className="h-4 w-4 mr-1" />
                                                            Zamítnout
                                                        </Button>
                                                    )}

                                                    {document.status !== 'pending' && (
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => openStatusDialog(document, 'reset')}
                                                        >
                                                            <RotateCcw className="h-4 w-4 mr-1" />
                                                            Reset
                                                        </Button>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Status Update Dialog */}
            <Dialog
                open={!!selectedDocument && !!dialogAction}
                onOpenChange={() => {
                    setSelectedDocument(null)
                    setDialogAction(null)
                    setNotes('')
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{getDialogTitle()}</DialogTitle>
                        <DialogDescription>{getDialogDescription()}</DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="notes">Poznámka (volitelné)</Label>
                            <Textarea
                                id="notes"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder={
                                    dialogAction === 'reject'
                                        ? 'Uveďte důvod zamítnutí...'
                                        : 'Přidejte poznámku k této akci...'
                                }
                                className="mt-2"
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setSelectedDocument(null)
                                setDialogAction(null)
                                setNotes('')
                            }}
                            disabled={isUpdating}
                        >
                            Zrušit
                        </Button>
                        <Button
                            onClick={handleStatusUpdate}
                            disabled={isUpdating}
                            className={
                                dialogAction === 'approve'
                                    ? 'bg-indigo-600 hover:bg-indigo-700'
                                    : dialogAction === 'reject'
                                    ? 'bg-rose-600 hover:bg-rose-700'
                                    : ''
                            }
                        >
                            {isUpdating ? 'Zpracovává se...' : 'Potvrdit'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}
