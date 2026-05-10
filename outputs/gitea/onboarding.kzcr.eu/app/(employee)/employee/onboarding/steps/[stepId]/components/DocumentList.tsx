"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  FileText, 
  Download, 
  ExternalLink, 
  CheckCircle, 
  Circle,
  Clock
} from "lucide-react"
import toast from "react-hot-toast"
import { downloadOnboardingDocument } from "@/lib/api/employee_onboarding"
import type { DocumentListProps } from "@/lib/types/onboarding-steps"

export default function DocumentList({ documents, userStep, onMarkAsRead }: DocumentListProps) {
  const [downloadingDocs, setDownloadingDocs] = useState<Set<string>>(new Set())
  const [markingDocs, setMarkingDocs] = useState<Set<string>>(new Set())

  const docReads = userStep.form_response?.docReads || {}

  const handleDownload = async (documentId: string, fileName: string) => {
    try {
      setDownloadingDocs(prev => new Set(prev).add(documentId))
      await downloadOnboardingDocument(documentId, fileName)
      toast.success('Dokument byl stažen')
    } catch (err) {
      toast.error('Nepodařilo se stáhnout dokument')
    } finally {
      setDownloadingDocs(prev => {
        const newSet = new Set(prev)
        newSet.delete(documentId)
        return newSet
      })
    }
  }

  const handleMarkAsRead = async (documentId: string) => {
    try {
      setMarkingDocs(prev => new Set(prev).add(documentId))
      await onMarkAsRead(documentId)
    } catch (err) {
      // Error handling is done in parent component
    } finally {
      setMarkingDocs(prev => {
        const newSet = new Set(prev)
        newSet.delete(documentId)
        return newSet
      })
    }
  }

  const getReadStatus = (documentId: string) => {
    const readAt = docReads[documentId]
    return {
      isRead: !!readAt,
      readAt: readAt ? new Date(readAt) : null
    }
  }

  if (documents.length === 0) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Dokumenty
          <Badge variant="outline">{documents.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {documents.map((document) => {
            const { isRead, readAt } = getReadStatus(document.document_id)
            const isDownloading = downloadingDocs.has(document.document_id)
            const isMarking = markingDocs.has(document.document_id)

            return (
              <div 
                key={document.document_id}
                className="flex items-start justify-between p-4 border rounded-lg hover:bg-gray-50"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {isRead ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <Circle className="h-4 w-4 text-muted-foreground" />
                    )}
                    <h4 className="font-medium">{document.name}</h4>
                    {document.is_mandatory && (
                      <Badge variant="outline" className="text-red-600 border-red-200 text-xs">
                        Povinný
                      </Badge>
                    )}
                  </div>
                  
                  {document.description && (
                    <p className="text-sm text-muted-foreground mb-2">
                      {document.description}
                    </p>
                  )}

                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    {isRead && readAt && (
                      <span className="flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" />
                        Přečteno {readAt.toLocaleDateString('cs-CZ')} v {readAt.toLocaleTimeString('cs-CZ')}
                      </span>
                    )}
                    {document.mime_type && (
                      <span>{document.mime_type}</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-4">
                  {/* Open/Download button */}
                  {document.download_url && document.file_name && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload(document.document_id, document.file_name!)}
                      disabled={isDownloading}
                      className="flex items-center gap-1"
                    >
                      {isDownloading ? (
                        <Clock className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <ExternalLink className="h-4 w-4" />
                          <Download className="h-3 w-3" />
                        </>
                      )}
                      Otevřít
                    </Button>
                  )}

                  {/* Mark as read button */}
                  {!isRead && (
                    <Button
                      size="sm"
                      onClick={() => handleMarkAsRead(document.document_id)}
                      disabled={isMarking || !document.download_url}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {isMarking ? (
                        <Clock className="h-4 w-4 animate-spin" />
                      ) : (
                        <CheckCircle className="h-4 w-4" />
                      )}
                      Označit jako přečtené
                    </Button>
                  )}

                  {/* Read status pill */}
                  {isRead && (
                    <Badge className="bg-green-50 text-green-700">
                      ✓ Přečteno
                    </Badge>
                  )}
                </div>
              </div>
            )
          })}

          {/* Summary */}
          <div className="mt-6 p-3 bg-muted rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
              <div>
                <span className="font-medium">Celkem dokumentů:</span> {documents.length}
              </div>
              <div>
                <span className="font-medium">Přečteno:</span> {Object.keys(docReads).length}
              </div>
              <div>
                <span className="font-medium">Povinných:</span> {documents.filter(d => d.is_mandatory).length}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}