'use client';

import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Paperclip,
  Upload,
  Download,
  Trash2,
  File,
  FileText,
  Image as ImageIcon,
  AlertCircle,
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { InterviewAttachment, InterviewStatus } from '@/lib/api/interviews';
import { useInterviewAttachments } from '../hooks/useInterviewAttachments';
import toast from 'react-hot-toast';

interface InterviewAttachmentsProps {
  interviewId: string;
  initialAttachments: InterviewAttachment[];
  interviewStatus: InterviewStatus;
  readOnly?: boolean;
}

export default function InterviewAttachments({
  interviewId,
  initialAttachments,
  interviewStatus,
  readOnly = false,
}: InterviewAttachmentsProps) {
  const {
    attachments,
    isUploading,
    uploadAttachment,
    deleteAttachment,
    downloadAttachment,
  } = useInterviewAttachments(interviewId, initialAttachments);

  const [attachmentToDelete, setAttachmentToDelete] = useState<InterviewAttachment | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isInterviewFinalized = interviewStatus === 'cancelled' || interviewStatus === 'completed';

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error('Soubor je příliš velký (maximálně 10 MB)');
      return;
    }

    try {
      await uploadAttachment(file);
      toast.success('Příloha byla nahrána');
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Failed to upload attachment:', error);
      toast.error('Nepodařilo se nahrát přílohu');
    }
  };

  const handleDeleteAttachment = async () => {
    if (!attachmentToDelete) return;

    setIsDeleting(true);
    try {
      await deleteAttachment(attachmentToDelete.id);
      toast.success('Příloha byla smazána');
      setAttachmentToDelete(null);
    } catch (error) {
      console.error('Failed to delete attachment:', error);
      toast.error('Nepodařilo se smazat přílohu');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDownload = async (attachment: InterviewAttachment) => {
    try {
      await downloadAttachment(attachment.id, attachment.original_filename);
    } catch (error) {
      console.error('Failed to download attachment:', error);
      toast.error('Nepodařilo se stáhnout přílohu');
    }
  };

  const getFileIcon = (mimeType: string | null) => {
    if (!mimeType) return File;
    if (mimeType.startsWith('image/')) return ImageIcon;
    if (mimeType.includes('pdf')) return FileText;
    return File;
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'Neznámá velikost';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="flex items-center gap-2">
            <Paperclip className="h-5 w-5" />
            Přílohy
            <Badge variant="secondary" className="ml-2">
              {attachments?.length || 0}
            </Badge>
          </CardTitle>
          <div>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleFileSelect}
              disabled={isUploading}
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              size="sm"
              disabled={readOnly || isUploading || isInterviewFinalized}
              title={isInterviewFinalized ? `Nelze přidat přílohy do ${interviewStatus === 'cancelled' ? 'zrušeného' : 'dokončeného'} pohovoru` : ''}
            >
              <Upload className="mr-2 h-4 w-4" />
              {isUploading ? 'Nahrávám...' : 'Nahrát přílohu'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {!attachments || attachments.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Paperclip className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-sm">Zatím nebyly přidány žádné přílohy</p>
              <p className="text-xs mt-1">Klikněte na tlačítko výše pro nahrání prvního souboru</p>
            </div>
          ) : (
            <div className="space-y-3">
              {attachments.map((attachment) => {
                const FileIcon = getFileIcon(attachment.mime_type);
                return (
                  <div
                    key={attachment.id}
                    className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <FileIcon className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium truncate">{attachment.original_filename}</h4>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                          <span>{formatFileSize(attachment.file_size)}</span>
                          <span>•</span>
                          <span>
                            Nahráno: {new Date(attachment.uploaded_at).toLocaleDateString('cs-CZ')}
                          </span>
                          {attachment.uploader_name && (
                            <>
                              <span>•</span>
                              <span>
                                {attachment.uploader_name} {attachment.uploader_surname}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDownload(attachment)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      {!readOnly && (
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={isInterviewFinalized}
                          onClick={() => setAttachmentToDelete(attachment)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!readOnly && !!attachmentToDelete}
        onOpenChange={(open) => !open && setAttachmentToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Smazat přílohu?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Opravdu chcete smazat přílohu &quot;{attachmentToDelete?.filename}&quot;?
              Tato akce nelze vrátit zpět.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Zrušit</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAttachment}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Mažu...' : 'Smazat'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
