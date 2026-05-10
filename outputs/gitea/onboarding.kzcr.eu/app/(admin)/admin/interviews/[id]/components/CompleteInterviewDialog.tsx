'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { Interview, completeInterview } from '@/lib/api/interviews';
import toast from 'react-hot-toast';

interface CompleteInterviewDialogProps {
  interview: Interview;
  isOpen: boolean;
  onOpenChange: () => void;
  onSuccess: (updatedInterview: Interview) => void;
}

export default function CompleteInterviewDialog({
  interview,
  isOpen,
  onOpenChange,
  onSuccess,
}: CompleteInterviewDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsSubmitting(true);
    try {
      const updated = await completeInterview(interview.id, feedback);
      toast.success('Pohovor byl označen jako dokončený');
      onSuccess(updated);
      onOpenChange();
      setFeedback('');
    } catch (error) {
      console.error('Failed to complete interview:', error);
      toast.error('Nepodařilo se označit pohovor jako dokončený');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setFeedback('');
      onOpenChange();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            Dokončit pohovor
          </DialogTitle>
          <DialogDescription>
            Označte pohovor s uchazečem{' '}
            <span className="font-medium">
              {interview.applicant_name} {interview.applicant_surname}
            </span>{' '}
            jako dokončený a přidejte zpětnou vazbu.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="feedback">Zpětná vazba (volitelné)</Label>
            <Textarea
              id="feedback"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={6}
              placeholder="Shrnutí pohovoru, hodnocení uchazeče, další kroky..."
              disabled={isSubmitting}
            />
            <p className="text-xs text-muted-foreground">
              Zpětně vazba bude uložena v historii pohovoru a bude přístupná týmu
            </p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
              Zruait
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Označit jako dokončeno
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
