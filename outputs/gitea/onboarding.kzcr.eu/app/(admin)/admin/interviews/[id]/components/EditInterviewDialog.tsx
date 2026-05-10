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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { cs } from 'date-fns/locale';
import { Interview, UpdateInterviewData, updateInterview } from '@/lib/api/interviews';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';

interface EditInterviewDialogProps {
  interview: Interview;
  isOpen: boolean;
  onOpenChange: () => void;
  onSuccess: (updatedInterview: Interview) => void;
}

export default function EditInterviewDialog({
  interview,
  isOpen,
  onOpenChange,
  onSuccess,
}: EditInterviewDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    interview.scheduled_at ? new Date(interview.scheduled_at) : undefined
  );
  const [selectedTime, setSelectedTime] = useState('');
  const [formData, setFormData] = useState<Partial<UpdateInterviewData>>({
    location: interview.location || '',
    online_meeting_link: interview.online_meeting_link || '',
    duration_minutes: interview.duration_minutes,
    description: interview.description || '',
    notes: interview.notes || '',
  });

  useEffect(() => {
    if (interview.scheduled_at) {
      const date = new Date(interview.scheduled_at);
      setSelectedDate(date);
      setSelectedTime(format(date, 'HH:mm'));
    }
  }, [interview.scheduled_at]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedDate || !selectedTime) {
      toast.error('Vyberte datum a čas');
      return;
    }

    // Combine date and time
    const [hours, minutes] = selectedTime.split(':').map(Number);
    const scheduledAt = new Date(selectedDate);
    scheduledAt.setHours(hours, minutes, 0, 0);

    const updateData: UpdateInterviewData = {
      ...formData,
      scheduled_at: scheduledAt.toISOString(),
    };

    setIsSubmitting(true);
    try {
      const updated = await updateInterview(interview.id, updateData);
      toast.success('Pohovor byl aktualizován');
      onSuccess(updated);
      onOpenChange();
    } catch (error) {
      console.error('Failed to update interview:', error);
      toast.error('Nepodařilo se aktualizovat pohovor');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Upravit pohovor</DialogTitle>
          <DialogDescription>
            Změňte detaily pohovoru s uchazečem {interview.applicant_name} {interview.applicant_surname}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Date and Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Datum *</Label>
              <Input
                id="date"
                type="date"
                value={selectedDate ? format(selectedDate, "yyyy-MM-dd") : ""}
                onChange={(e) => setSelectedDate(e.target.value ? new Date(e.target.value) : undefined)}
                min={format(new Date(), "yyyy-MM-dd")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="time">Čas *</Label>
              <Input
                id="time"
                type="time"
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
              />
            </div>
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <Label htmlFor="duration">Délka (minuty) *</Label>
            <Input
              id="duration"
              type="number"
              min="15"
              step="15"
              value={formData.duration_minutes || ''}
              onChange={(e) =>
                setFormData({ ...formData, duration_minutes: parseInt(e.target.value) })
              }
              required
            />
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location">Místo konání / adresa (volitelné)</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="např. Kancelář 301"
            />
          </div>

          {/* Meeting Link */}
          <div className="space-y-2">
            <Label htmlFor="meeting_link">Online odkaz (volitelné)</Label>
            <Input
              id="meeting_link"
              type="url"
              value={formData.online_meeting_link}
              onChange={(e) => setFormData({ ...formData, online_meeting_link: e.target.value })}
              placeholder="https://meet.google.com/..."
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Popis</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              placeholder="Stručný popis pohovoru..."
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Poznámky</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              placeholder="Interní poznámky (viditelné pouze pro tým)..."
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onOpenChange} disabled={isSubmitting}>
              Zrušit
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Uložit změny
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
