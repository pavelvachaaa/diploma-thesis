import { useState, useCallback } from 'react';
import {
  InterviewAttachment,
  uploadAttachment as uploadAttachmentApi,
  deleteAttachment as deleteAttachmentApi,
  downloadInterviewAttachment
} from '@/lib/api/interviews';

export function useInterviewAttachments(
  interviewId: string,
  initialAttachments: InterviewAttachment[]
) {
  const [attachments, setAttachments] = useState<InterviewAttachment[]>(initialAttachments);
  const [isUploading, setIsUploading] = useState(false);

  const uploadAttachment = useCallback(async (file: File) => {
    setIsUploading(true);
    try {
      const newAttachment = await uploadAttachmentApi(interviewId, file);
      setAttachments((prev) => [...prev, newAttachment]);
      return newAttachment;
    } finally {
      setIsUploading(false);
    }
  }, [interviewId]);

  const deleteAttachment = useCallback(async (attachmentId: string) => {
    await deleteAttachmentApi(interviewId, attachmentId);
    setAttachments((prev) => prev.filter((a) => a.id !== attachmentId));
  }, [interviewId]);

  const downloadAttachment = useCallback(async (attachmentId: string, filename: string) => {
    await downloadInterviewAttachment(interviewId, attachmentId, filename);
  }, [interviewId]);

  return {
    attachments,
    isUploading,
    uploadAttachment,
    deleteAttachment,
    downloadAttachment,
  };
}
