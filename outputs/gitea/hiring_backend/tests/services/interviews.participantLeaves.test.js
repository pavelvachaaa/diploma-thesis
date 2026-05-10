const { createMockLogger } = require('../helpers');
const createParticipantMutations = require('../../src/domain/interviews/service/participantMutations');
const createInvitationResend = require('../../src/domain/interviews/service/invitationResend');
const createAttendance = require('../../src/domain/interviews/service/attendance');

describe('interviews participant leaves', () => {
    it('adds participants through participant mutation leaf', async () => {
        const calendarRepository = {
            getById: jest.fn()
                .mockResolvedValueOnce({ id: 'int-1', status: 'scheduled' })
                .mockResolvedValueOnce({ id: 'int-1', participants: [{ id: 'participant-1', user_email: 'p@example.com' }] }),
            addParticipant: jest.fn().mockResolvedValue({ id: 'participant-1' })
        };
        const leaf = createParticipantMutations({
            calendarRepository,
            runtimeSupport: {
                logger: createMockLogger(),
                runBestEffort: jest.fn(({ task }) => task())
            },
            participantNotifications: {
                notifyAddedParticipant: jest.fn().mockResolvedValue({}),
                sendInvitationToParticipant: jest.fn().mockResolvedValue({})
            }
        });

        const result = await leaf.addParticipants('int-1', [{ user_id: 'user-2' }]);
        expect(result).toEqual([{ id: 'participant-1' }]);
    });

    it('resends invitation through resend leaf', async () => {
        const leaf = createInvitationResend({
            calendarRepository: {
                getById: jest.fn().mockResolvedValue({
                    id: 'int-1',
                    organization_id: 'org-1',
                    status: 'scheduled',
                    applicant_email: 'a@example.com',
                    participants: [{ id: 'participant-1', user_email: 'p@example.com' }]
                })
            },
            runtimeSupport: {
                logger: createMockLogger()
            },
            auditSupport: {
                emitAudit: jest.fn()
            },
            resendNotifications: {
                sendInvitationToApplicant: jest.fn().mockResolvedValue({}),
                sendInvitationToParticipant: jest.fn().mockResolvedValue({})
            }
        });

        const result = await leaf.resendInvitation('int-1', {
            target: 'participant',
            participantId: 'participant-1'
        });

        expect(result.sentTo).toBe('p@example.com');
    });

    it('confirms attendance through attendance leaf', async () => {
        const calendarRepository = {
            getParticipants: jest.fn().mockResolvedValue([{ id: 'participant-1', user_id: 'user-1' }]),
            updateParticipantStatus: jest.fn().mockResolvedValue({ id: 'participant-1', attendance_status: 'accepted' })
        };
        const leaf = createAttendance({ calendarRepository });

        const result = await leaf.confirmAttendance('int-1', 'user-1');
        expect(result).toEqual({ id: 'participant-1', attendance_status: 'accepted' });
    });
});
