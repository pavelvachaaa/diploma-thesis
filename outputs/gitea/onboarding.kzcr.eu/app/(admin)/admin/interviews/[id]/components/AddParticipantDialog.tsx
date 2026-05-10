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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, UserPlus, Mail, User as UserIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Participant, addParticipant, ParticipantInput } from '@/lib/api/interviews';
import { Employee, getAllEmployees } from "@/lib/api/employees";
import toast from 'react-hot-toast';
import { AsyncCombobox } from "@/components/search_select/AsyncSearchSelect";


interface AddParticipantDialogProps {
  interviewId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (participant: Participant) => void;
}

export default function AddParticipantDialog({
  interviewId,
  isOpen,
  onClose,
  onSuccess,
}: AddParticipantDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [participantMode, setParticipantMode] = useState<'internal' | 'external'>('external');

  // Internal selection state
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  // External input state
  const [externalName, setExternalName] = useState('');
  const [externalEmail, setExternalEmail] = useState('');

  const [role, setRole] = useState<'organizer' | 'interviewer' | 'observer'>('interviewer');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let payload: ParticipantInput;

    if (participantMode === 'internal') {
      if (!selectedEmployee) {
        toast.error('Vyberte zaměstnance');
        return;
      }
      payload = {
        user_id: selectedEmployee.id,
        role: role,
      };
    } else {
      if (!externalName || !externalEmail) {
        toast.error('Vyplňte jméno a email hosta');
        return;
      }
      payload = {
        external_name: externalName,
        external_email: externalEmail,
        role: role,
      };
    }

    setIsSubmitting(true);
    try {
      const newParticipant = await addParticipant(interviewId, payload);
      toast.success('Účastník byl přidán');
      onSuccess(newParticipant);
      handleClose();
    } catch (error) {
      console.error('Failed to add participant:', error);
      toast.error('Nepodařilo se přidat účastníka');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setSelectedEmployee(null);
      setExternalName('');
      setExternalEmail('');
      setRole('interviewer');
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Přidat účastníka
          </DialogTitle>
          <DialogDescription>
            Vyhledejte kolegu nebo přidejte externího hosta.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-2">
          {/* Mode Switcher */}
          <Tabs value={participantMode} onValueChange={(v: any) => setParticipantMode(v)}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="internal">Zaměstnanec</TabsTrigger>
              <TabsTrigger value="external">Externí host</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="space-y-4">
            {participantMode === 'internal' ? (
              <AsyncCombobox<Employee>
                label="Vyhledat kolegu"
                placeholder="Jméno nebo email..."
                fetchItems={(search) =>
                  getAllEmployees({ search, limit: 10 }).then(r => r.data)
                }
                getItemLabel={(e) => `${e.name} ${e.surname}`}
                getItemDescription={(e) => e.email}
                onSelect={(e) => setSelectedEmployee(e)}
              />
            ) : (
              <div className="space-y-3 animate-in fade-in slide-in-from-top-1">
                <div className="space-y-2">
                  <Label>Jméno hosta</Label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      className="pl-9"
                      placeholder="např. Jan Novák"
                      value={externalName}
                      onChange={(e) => setExternalName(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Email hosta</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      className="pl-9"
                      type="email"
                      placeholder="email@priklad.cz"
                      value={externalEmail}
                      onChange={(e) => setExternalEmail(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Role Selection */}
            <div className="space-y-2 border-t pt-4">
              <Label htmlFor="role">Role v pohovoru</Label>
              <Select
                value={role}
                onValueChange={(value: any) => setRole(value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="interviewer">Tazatel</SelectItem>
                  <SelectItem value="organizer">Organizátor</SelectItem>
                  <SelectItem value="observer">Pozorovatel</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
              Zrušit
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || (participantMode === 'internal' && !selectedEmployee)}
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {participantMode === 'internal' ? 'Přidat kolegu' : 'Přidat hosta'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}