const { createMockLogger } = require('../helpers');
const createInterviewCrud = require('../../src/domain/interviews/service/interviewCrud');

describe('interviews interviewCrud slice', () => {
    it('creates interview, links applicant attachments, updates applicant status and schedules notifications', async () => {
        const interview = {
            id: 'interview-1',
            applicant_id: 'applicant-1',
            organization_id: 'org-1',
            created_by: 'user-1',
            participants: [],
            attachments: []
        };
        const fullInterview = {
            ...interview,
            participants: [{ id: 'participant-1' }],
            attachments: [{ id: 'attachment-1' }]
        };

        const calendarRepository = {
            create: jest.fn().mockResolvedValue(interview),
            addParticipant: jest.fn().mockResolvedValue({}),
            addAttachment: jest.fn().mockResolvedValue({}),
            getById: jest.fn().mockResolvedValue(fullInterview)
        };

        const slice = createInterviewCrud({
            calendarRepository,
            applicantDocumentsQueryPort: {
                getApplicantAttachments: jest.fn().mockResolvedValue([{ file_id: 'file-1' }])
            },
            applicantsStatusCommandPort: {
                updateApplicantStatus: jest.fn().mockResolvedValue({})
            },
            runtimeSupport: {
                logger: createMockLogger(),
                runBestEffort: jest.fn(({ task }) => task())
            },
            auditSupport: {
                emitAudit: jest.fn(),
                createInterviewSnapshot: jest.fn((value) => value),
                getChangedFields: jest.fn()
            },
            interviewNotifications: {
                enqueueInterviewScheduledRoleNotification: jest.fn().mockResolvedValue({}),
                enqueueInterviewCancelledRoleNotification: jest.fn().mockResolvedValue({}),
                notifyParticipants: jest.fn().mockResolvedValue({}),
                sendInvitationEmails: jest.fn().mockResolvedValue({}),
                sendUpdateNotifications: jest.fn().mockResolvedValue({}),
                sendCancellationNotifications: jest.fn().mockResolvedValue({})
            }
        });

        const result = await slice.createInterview({
            applicant_id: 'applicant-1',
            created_by: 'user-1'
        }, []);

        expect(result).toEqual(fullInterview);
        expect(calendarRepository.addParticipant).toHaveBeenCalledWith(
            'interview-1',
            expect.objectContaining({ role: 'organizer' }),
            {}
        );
        expect(calendarRepository.addAttachment).toHaveBeenCalledWith(
            'interview-1',
            expect.objectContaining({ file_id: 'file-1' }),
            {}
        );
    });
});
