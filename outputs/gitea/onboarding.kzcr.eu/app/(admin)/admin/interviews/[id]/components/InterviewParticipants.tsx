'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  UserPlus,
  UserMinus,
  Mail,
  User,
  Trash2,
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
import { Participant, InterviewStatus } from '@/lib/api/interviews';
import { useInterviewParticipants } from '../hooks/useInterviewParticipants';
import AddParticipantDialog from './AddParticipantDialog';
import toast from 'react-hot-toast';

interface InterviewParticipantsProps {
  interviewId: string;
  initialParticipants: Participant[];
  interviewStatus: InterviewStatus;
  readOnly?: boolean;
}

export default function InterviewParticipants({
  interviewId,
  initialParticipants,
  interviewStatus,
  readOnly = false,
}: InterviewParticipantsProps) {
  const {
    participants,
    isLoading,
    addParticipant,
    removeParticipant,
    resendInvitation,
  } = useInterviewParticipants(interviewId, initialParticipants);

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [participantToRemove, setParticipantToRemove] = useState<Participant | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);
  const [resendingFor, setResendingFor] = useState<string | null>(null);

  const isInterviewFinalized = interviewStatus === 'cancelled' || interviewStatus === 'completed';

  const handleRemoveParticipant = async () => {
    if (!participantToRemove) return;

    setIsRemoving(true);
    try {
      await removeParticipant(participantToRemove.id);
      toast.success('Účastník byl odebrán');
      setParticipantToRemove(null);
    } catch (error) {
      console.error('Failed to remove participant:', error);
      toast.error('Nepodařilo se odebrat účastníka');
    } finally {
      setIsRemoving(false);
    }
  };

  const handleResendInvitation = async (participantId: string) => {
    setResendingFor(participantId);
    try {
      const result = await resendInvitation(participantId);
      toast.success(`Pozvánka byla odeslána na ${result.sentTo}`);
    } catch (error) {
      console.error('Failed to resend invitation:', error);
      toast.error('Nepodařilo se odeslat pozvánku');
    } finally {
      setResendingFor(null);
    }
  };

  const getRoleLabel = (role: string) => {
    const roleLabels: Record<string, string> = {
      interviewer: 'Tazatel',
      observer: 'Pozorovatel',
      organizer: 'Organizátor',
    };
    return roleLabels[role] || role;
  };

  const getRoleBadgeVariant = (role: string): 'default' | 'secondary' | 'outline' => {
    if (role === 'interviewer') return 'default';
    if (role === 'organizer') return 'secondary';
    return 'outline';
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Účastníci pohovoru
            <Badge variant="secondary" className="ml-2">
              {participants?.length || 0}
            </Badge>
          </CardTitle>
          <Button
            onClick={() => setShowAddDialog(true)}
            size="sm"
            disabled={readOnly || isLoading || isInterviewFinalized}
            title={isInterviewFinalized ? `Nelze přidat účastníky do ${interviewStatus === 'cancelled' ? 'zrušeného' : 'dokončeného'} pohovoru` : ''}
          >
            <UserPlus className="mr-2 h-4 w-4" />
            Přidat účastníka
          </Button>
        </CardHeader>
        <CardContent>
          {!participants || participants.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-sm">Zatím nebyli přidáni žádní účastníci</p>
              <p className="text-xs mt-1">Klikněte na tlačítko výše pro přidání prvního účastníka</p>
            </div>
          ) : (
            <div className="space-y-3">
              {participants.map((participant) => (
                <div
                  key={participant.id}
                  className="p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm break-words mb-1">
                        {participant.user_name} {participant.user_surname}
                      </h4>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant={getRoleBadgeVariant(participant.role)} className="text-xs">
                          {getRoleLabel(participant.role)}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {participant.attendance_status === 'accepted' && 'Přijato'}
                          {participant.attendance_status === 'declined' && 'Odmítnuto'}
                          {participant.attendance_status === 'tentative' && 'Možná'}
                          {participant.attendance_status === 'pending' && 'Čeká'}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {participant.user_email && (
                    <div className="flex items-center gap-2 mb-2 ml-12 text-sm text-muted-foreground">
                      <Mail className="h-3 w-3 flex-shrink-0" />
                      <a
                        href={`mailto:${participant.user_email}`}
                        className="hover:underline break-all"
                      >
                        {participant.user_email}
                      </a>
                    </div>
                  )}

                  <div className="ml-12 text-xs text-muted-foreground mb-3">
                    <span>Přidán: {new Date(participant.created_at).toLocaleDateString('cs-CZ')}</span>
                  </div>

                  {!readOnly && (
                    <div className="flex gap-2 ml-12">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleResendInvitation(participant.id)}
                        disabled={isLoading || isInterviewFinalized || resendingFor === participant.id}
                        className="flex-1"
                        title="Znovu odeslat pozvánku"
                      >
                        <Mail className="h-4 w-4 mr-1" />
                        {resendingFor === participant.id ? 'Odesílání...' : 'Odeslat znovu'}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setParticipantToRemove(participant)}
                        disabled={isRemoving || isInterviewFinalized}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        title={isInterviewFinalized ? `Nelze odebrat účastníky z ${interviewStatus === 'cancelled' ? 'zrušeného' : 'dokončeného'} pohovoru` : 'Odebrat účastníka'}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Participant Dialog */}
      {!readOnly && (
        <AddParticipantDialog
          interviewId={interviewId}
          isOpen={showAddDialog}
          onClose={() => setShowAddDialog(false)}
          onSuccess={addParticipant}
        />
      )}

      {/* Remove Participant Confirmation */}
      <AlertDialog open={!readOnly && !!participantToRemove} onOpenChange={() => setParticipantToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Odebrat   účastníka?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Opravdu chcete odebrat účastníka{' '}
              <span className="font-medium">
                {participantToRemove?.user_name} {participantToRemove?.user_surname}
              </span>{' '}
              z tohoto pohovoru?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRemoving}>Zruait</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveParticipant}
              disabled={isRemoving}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isRemoving ? 'Odebírám...' : 'Odebrat účastníka'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
