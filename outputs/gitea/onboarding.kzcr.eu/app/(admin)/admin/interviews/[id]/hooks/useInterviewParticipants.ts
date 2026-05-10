import { useState, useCallback } from 'react';
import {
  Participant,
  removeParticipant as removeParticipantApi,
  resendParticipantInvitation as resendParticipantInvitationApi
} from '@/lib/api/interviews';

export function useInterviewParticipants(
  interviewId: string,
  initialParticipants: Participant[]
) {
  const [participants, setParticipants] = useState<Participant[]>(initialParticipants);
  const [isLoading, setIsLoading] = useState(false);

  const addParticipant = useCallback((participant: Participant) => {
    setParticipants((prev) => [...prev, participant]);
  }, []);

  const removeParticipant = useCallback(async (participantId: string) => {
    setIsLoading(true);
    try {
      await removeParticipantApi(interviewId, participantId);
      setParticipants((prev) => prev.filter((p) => p.id !== participantId));
    } finally {
      setIsLoading(false);
    }
  }, [interviewId]);

  const resendInvitation = useCallback(async (participantId: string) => {
    setIsLoading(true);
    try {
      const result = await resendParticipantInvitationApi(interviewId, participantId);
      return result;
    } finally {
      setIsLoading(false);
    }
  }, [interviewId]);

  return {
    participants,
    isLoading,
    addParticipant,
    removeParticipant,
    resendInvitation,
  };
}
