const { PARTICIPANT_ROLE_LABELS } = require('@domain/interviews/service/shared/constants');

module.exports = ({ sideEffectOutboxService, logger }) => {
    if (!sideEffectOutboxService?.enqueueRoleNotification || !sideEffectOutboxService?.enqueueUserNotification) {
        throw new Error('sideEffectOutboxService role/user enqueue dependencies are required for interview events');
    }

    const enqueueInterviewScheduledRoleNotification = async (interview) => {
        if (!interview?.organization_id) {
            return null;
        }

        return sideEffectOutboxService.enqueueRoleNotification({
            type: 'interview.scheduled',
            organizationId: interview.organization_id,
            title: 'Naplánovaný pohovor',
            body: `Pohovor s ${interview.applicant_name} ${interview.applicant_surname} byl naplánován`,
            data: { interviewId: interview.id, applicantId: interview.applicant_id },
            roleName: 'HR'
        }, {
            aggregateType: 'interview',
            aggregateId: interview.id,
            organizationId: interview.organization_id,
            idempotencyKey: `interview.scheduled.role.${interview.id}`
        });
    };

    const enqueueInterviewCancelledRoleNotification = async (interview) => {
        if (!interview?.organization_id) {
            return null;
        }

        return sideEffectOutboxService.enqueueRoleNotification({
            type: 'interview.cancelled',
            organizationId: interview.organization_id,
            title: 'Pohovor zrušen',
            body: `Pohovor s ${interview.applicant_name} ${interview.applicant_surname} byl zrušen`,
            data: { interviewId: interview.id, applicantId: interview.applicant_id },
            roleName: 'HR'
        }, {
            aggregateType: 'interview',
            aggregateId: interview.id,
            organizationId: interview.organization_id,
            idempotencyKey: `interview.cancelled.role.${interview.id}`
        });
    };

    const enqueueParticipantScheduledNotification = async ({ participant, interview, idempotencyContext }) => {
        if (!participant?.user_id || participant.role === 'organizer') {
            return null;
        }

        const roleLabel = PARTICIPANT_ROLE_LABELS[participant.role] || participant.role;
        const outboxEvent = await sideEffectOutboxService.enqueueUserNotification({
            userId: participant.user_id,
            type: 'interview.scheduled',
            title: 'Naplánovaný pohovor',
            body: `Byl/a jste přidán/a jako ${roleLabel} na pohovor s ${interview.applicant_name} ${interview.applicant_surname}`,
            data: {
                interviewId: interview.id,
                applicantId: interview.applicant_id
            }
        }, {
            aggregateType: 'interview',
            aggregateId: interview.id,
            organizationId: interview.organization_id || null,
            idempotencyKey: `interview.scheduled.participant.${idempotencyContext}.${interview.id}.${participant.user_id}`
        });

        logger.info('Interview participant notification intent queued', {
            interviewId: interview.id,
            participantUserId: participant.user_id,
            participantRole: participant.role,
            outboxId: outboxEvent?.id || null
        });

        return outboxEvent;
    };

    return {
        enqueueInterviewScheduledRoleNotification,
        enqueueInterviewCancelledRoleNotification,
        enqueueParticipantScheduledNotification
    };
};
