const createParticipants = require('@domain/interviews/service/participants');
const { createMockLogger } = require('../../../helpers');

describe('interviews participants use-cases', () => {
    let participants;
    let calendarRepository;
    let logger;
    let emitAudit;
    let runBestEffort;
    let notifyAddedParticipant;
    let sendInvitationToApplicant;
    let sendInvitationToParticipant;

    beforeEach(() => {
        calendarRepository = {
            getById: jest.fn(),
            addParticipant: jest.fn(),
            removeParticipant: jest.fn(),
            getParticipants: jest.fn(),
            updateParticipantStatus: jest.fn()
        };
        logger = createMockLogger();
        emitAudit = jest.fn();
        runBestEffort = jest.fn();
        notifyAddedParticipant = jest.fn();
        sendInvitationToApplicant = jest.fn();
        sendInvitationToParticipant = jest.fn();

        participants = createParticipants({
            calendarRepository,
            logger,
            emitAudit,
            runBestEffort,
            notifyAddedParticipant,
            sendInvitationToApplicant,
            sendInvitationToParticipant
        });
    });

    it('resendInvitation sends participant invitation and emits success audit', async () => {
        calendarRepository.getById.mockResolvedValue({
            id: 'interview-1',
            organization_id: 'org-1',
            status: 'scheduled',
            applicant_email: 'applicant@example.com',
            participants: [
                {
                    id: 'participant-1',
                    user_email: 'participant@example.com'
                }
            ]
        });

        const result = await participants.resendInvitation('interview-1', {
            target: 'participant',
            participantId: 'participant-1'
        });

        expect(sendInvitationToParticipant).toHaveBeenCalled();
        expect(emitAudit).toHaveBeenCalledWith(expect.objectContaining({
            action: 'interview.invitation.resend',
            status: 'success'
        }));
        expect(result).toEqual({
            success: true,
            message: 'Invitation resent to participant',
            sentTo: 'participant@example.com'
        });
    });

    it('resendInvitation emits failure audit for invalid target', async () => {
        calendarRepository.getById.mockResolvedValue({
            id: 'interview-1',
            organization_id: 'org-1',
            status: 'scheduled',
            participants: []
        });

        await expect(participants.resendInvitation('interview-1', {
            target: 'invalid'
        })).rejects.toThrow('Invalid target. Must be "applicant" or "participant"');

        expect(emitAudit).toHaveBeenCalledWith(expect.objectContaining({
            action: 'interview.invitation.resend',
            status: 'failure'
        }));
    });
});
