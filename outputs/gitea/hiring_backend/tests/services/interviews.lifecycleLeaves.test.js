const { createMockLogger } = require('../helpers');
const createCreateInterview = require('../../src/domain/interviews/service/createInterview');
const createUpdateInterview = require('../../src/domain/interviews/service/updateInterview');
const createCancelInterview = require('../../src/domain/interviews/service/cancelInterview');

describe('interviews lifecycle leaves', () => {
    const runtimeSupport = {
        logger: createMockLogger(),
        runBestEffort: jest.fn(({ task }) => task())
    };
    const auditSupport = {
        emitAudit: jest.fn(),
        createInterviewSnapshot: jest.fn((value) => value),
        getChangedFields: jest.fn(() => ['scheduled_at'])
    };

    it('creates interview through create leaf', async () => {
        const calendarRepository = {
            create: jest.fn().mockResolvedValue({ id: 'int-1', applicant_id: 'app-1', organization_id: 'org-1', created_by: 'user-1' }),
            addParticipant: jest.fn().mockResolvedValue({}),
            addAttachment: jest.fn().mockResolvedValue({}),
            getById: jest.fn().mockResolvedValue({ id: 'int-1', applicant_id: 'app-1', organization_id: 'org-1', created_by: 'user-1', participants: [], attachments: [] })
        };

        const leaf = createCreateInterview({
            calendarRepository,
            applicantDocumentsQueryPort: { getApplicantAttachments: jest.fn().mockResolvedValue([]) },
            applicantsStatusCommandPort: { updateApplicantStatus: jest.fn().mockResolvedValue({}) },
            runtimeSupport,
            auditSupport,
            interviewNotifications: {
                enqueueInterviewScheduledRoleNotification: jest.fn().mockResolvedValue({}),
                notifyParticipants: jest.fn().mockResolvedValue({}),
                sendInvitationEmails: jest.fn().mockResolvedValue({})
            }
        });

        await leaf.createInterview({ applicant_id: 'app-1', created_by: 'user-1' }, []);
        expect(calendarRepository.create).toHaveBeenCalled();
    });

    it('updates interview through update leaf', async () => {
        const calendarRepository = {
            getById: jest.fn()
                .mockResolvedValueOnce({ id: 'int-1', organization_id: 'org-1' })
                .mockResolvedValueOnce({ id: 'int-1', organization_id: 'org-1' }),
            update: jest.fn().mockResolvedValue({ id: 'int-1' })
        };

        const leaf = createUpdateInterview({
            calendarRepository,
            runtimeSupport,
            auditSupport,
            interviewNotifications: {
                sendUpdateNotifications: jest.fn().mockResolvedValue({})
            }
        });

        const result = await leaf.updateInterview('int-1', { title: 'Updated' }, 'user-1');
        expect(result).toEqual({ id: 'int-1', organization_id: 'org-1' });
    });

    it('cancels interview through cancel leaf', async () => {
        const calendarRepository = {
            getById: jest.fn()
                .mockResolvedValueOnce({ id: 'int-1', organization_id: 'org-1' })
                .mockResolvedValueOnce({ id: 'int-1', organization_id: 'org-1', status: 'cancelled' }),
            cancel: jest.fn().mockResolvedValue({ id: 'int-1', status: 'cancelled' })
        };

        const leaf = createCancelInterview({
            calendarRepository,
            runtimeSupport,
            auditSupport,
            interviewNotifications: {
                enqueueInterviewCancelledRoleNotification: jest.fn().mockResolvedValue({}),
                sendCancellationNotifications: jest.fn().mockResolvedValue({})
            }
        });

        const result = await leaf.cancelInterview('int-1', 'reason', 'user-1');
        expect(result).toEqual({ id: 'int-1', status: 'cancelled' });
    });
});
