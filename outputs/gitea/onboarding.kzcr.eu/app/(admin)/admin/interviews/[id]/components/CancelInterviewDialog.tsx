'use client';

import React, { useState, useEffect } from 'react';
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
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AlertCircle, Loader2, XCircle } from 'lucide-react';
import { Interview, cancelInterview } from '@/lib/api/interviews';
import { getEmailTemplates, type EmailTemplate } from '@/lib/api/email_templates';
import toast from 'react-hot-toast';

interface CancelInterviewDialogProps {
  interview: Interview;
  isOpen: boolean;
  onOpenChange: () => void;
  onSuccess: (updatedInterview: Interview) => void;
}

export default function CancelInterviewDialog({
  interview,
  isOpen,
  onOpenChange,
  onSuccess,
}: CancelInterviewDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reason, setReason] = useState('');
  const [sendNotification, setSendNotification] = useState(true);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [loadingTemplates, setLoadingTemplates] = useState(false);

  useEffect(() => {
    if (isOpen && sendNotification) {
      loadTemplates();
    }
  }, [isOpen]);

  const loadTemplates = async () => {
    setLoadingTemplates(true);
    try {
      const data = await getEmailTemplates('interview_cancellation');
      setTemplates(data);
    } catch (error) {
      // Templates are optional - don't show error
    } finally {
      setLoadingTemplates(false);
    }
  };

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplateId(templateId);
    if (templateId) {
      const template = templates.find(t => t.id === templateId);
      if (template) {
        setEmailBody(template.body);
      }
    } else {
      setEmailBody('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!reason.trim()) {
      toast.error('Zadejte důvod zrušení');
      return;
    }

    setIsSubmitting(true);
    try {
      const updated = await cancelInterview(interview.id, reason, {
        sendNotification,
        customEmailBody: sendNotification && emailBody.trim() ? emailBody.trim() : undefined,
      });
      toast.success('Pohovor byl zrušen');
      onSuccess(updated);
      onOpenChange();
      handleClose();
    } catch (error) {
      console.error('Failed to cancel interview:', error);
      toast.error('Nepodařilo se zrušit pohovor');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setReason('');
      setSendNotification(true);
      setSelectedTemplateId('');
      setEmailBody('');
      onOpenChange();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <XCircle className="h-5 w-5" />
            Zrušit pohovor
          </DialogTitle>
          <DialogDescription>
            Opravdu chcete zrušit pohovor s uchazečem{' '}
            <span className="font-medium">
              {interview.applicant_name} {interview.applicant_surname}
            </span>
            ?
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reason">Důvod zrušení *</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder="Uveďte důvod zrušení pohovoru..."
              required
              disabled={isSubmitting}
            />
            <p className="text-xs text-muted-foreground">
              Tento důvod bude zobrazen v historii pohovoru
            </p>
          </div>

          {/* Email notification switch */}
          <div className="flex items-center justify-between py-1">
            <div>
              <Label htmlFor="send-notification" className="font-medium">Odeslat e-mail o zrušení</Label>
              <p className="text-xs text-muted-foreground">
                {sendNotification ? 'Uchazeč a účastníci budou informováni e-mailem' : 'E-mail nebude odeslán'}
              </p>
            </div>
            <Switch
              id="send-notification"
              checked={sendNotification}
              onCheckedChange={setSendNotification}
              disabled={isSubmitting}
            />
          </div>

          {/* Template and email body */}
          {sendNotification && (
            <div className="space-y-3 border-t pt-3">
              {templates.length > 0 && (
                <div className="space-y-1.5">
                  <Label>Šablona e-mailu (volitelné)</Label>
                  <Select
                    value={selectedTemplateId}
                    onValueChange={handleTemplateSelect}
                    disabled={isSubmitting || loadingTemplates}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Vyberte šablonu nebo napište vlastní text..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Vlastní text</SelectItem>
                      {templates.map(t => (
                        <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="email-body">Text e-mailu (volitelné)</Label>
                <Textarea
                  id="email-body"
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  rows={4}
                  placeholder="Ponechte prázdné pro použití výchozí šablony..."
                  disabled={isSubmitting}
                />
                <p className="text-xs text-muted-foreground">
                  Pokud nezadáte text, použije se výchozí šablona.
                </p>
              </div>
            </div>
          )}

          <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
            <AlertCircle className="h-4 w-4 text-destructive mt-0.5" />
            <p className="text-sm text-destructive">
              Zrušení pohovoru nelze vrátit zpět.
            </p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
              Zpět
            </Button>
            <Button
              type="submit"
              variant="destructive"
              disabled={isSubmitting || !reason.trim()}
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Zrušit pohovor
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
