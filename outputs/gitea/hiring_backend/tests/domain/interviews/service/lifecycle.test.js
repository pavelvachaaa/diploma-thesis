const createLifecycle = require('@domain/interviews/service/lifecycle');
const { createMockLogger } = require('../../../helpers');

describe('interviews lifecycle use-cases', () => {
    let calendarRepository;
    let applicantDocumentsQueryPort;
    let applicantsStatusCommandPort;
    let logger;
    let emitAudit;
    let createInterviewSnapshot;
    let getChangedFields;
    let runBestEffort;
    let enqueueInterviewScheduledRoleNotification;
    let enqueueInterviewCancelledRoleNotification;
    let notifyParticipants;
    let sendInvitationEmails;
    let sendUpdateNotifications;
    let sendCancellationNotifications;
    let lifecycle;

    beforeEach(() => {
        calendarRepository = {
            create: jest.fn(),
            addParticipant: jest.fn(),
            addAttachment: jest.fn(),
            getById: jest.fn(),
            update: jest.fn(),
            cancel: jest.fn(),
            updateStatus: jest.fn(),
            getApplicantIdByInterviewId: jest.fn()
        };
        applicantDocumentsQueryPort = {
            getApplicantAttachments: jest.fn()
        };
        applicantsStatusCommandPort = {
            updateApplicantStatus: jest.fn()
        };
        logger = createMockLogger();
        emitAudit = jest.fn();
        createInterviewSnapshot = jest.fn((value) => value);
        getChangedFields = jest.fn(() => ['scheduled_at']);
        runBestEffort = jest.fn();
        enqueueInterviewScheduledRoleNotification = jest.fn();
        enqueueInterviewCancelledRoleNotification = jest.fn();
        notifyParticipants = jest.fn();
        sendInvitationEmails = jest.fn();
        sendUpdateNotifications = jest.fn();
        sendCancellationNotifications = jest.fn();

        lifecycle = createLifecycle({
            calendarRepository,
            applicantDocumentsQueryPort,
            applicantsStatusCommandPort,
            logger,
            emitAudit,
            createInterviewSnapshot,
            getChangedFields,
            runBestEffort,
            enqueueInterviewScheduledRoleNotification,
            enqueueInterviewCancelledRoleNotification,
            notifyParticipants,
            sendInvitationEmails,
            sendUpdateNotifications,
            sendCancellationNotifications
        });
    });

    it('createInterview writes audit and schedules background side effects', async () => {
        const data = {
            applicant_id: 'applicant-1',
            created_by: 'user-1'
        };
        const interview = { id: 'interview-1' };
        const fullInterview = {
            id: 'interview-1',
            applicant_id: 'applicant-1',
            created_by: 'user-1',
            organization_id: 'org-1',
            participants: [{ id: 'participant-1' }],
            attachments: [{ id: 'attachment-1' }],
            applicant_name: 'Jan',
            applicant_surname: 'Novak'
        };

        calendarRepository.create.mockResolvedValue(interview);
        calendarRepository.getById.mockResolvedValue(fullInterview);
        applicantDocumentsQueryPort.getApplicantAttachments.mockResolvedValue([
            {
                file_path: 'applicant-attachments/cv.pdf',
                filename: 'cv.pdf',
                original_filename: 'cv.pdf',
                mime_type: 'application/pdf',
                file_size: 10
            }
        ]);

        const result = await lifecycle.createInterview(data, []);

        expect(result).toBe(fullInterview);
        expect(applicantsStatusCommandPort.updateApplicantStatus).toHaveBeenCalledWith('applicant-1', 'interview_scheduled', 'user-1');
        expect(emitAudit).toHaveBeenCalledWith(expect.objectContaining({
            action: 'interview.create',
            status: 'success',
            resourceId: 'interview-1'
        }));
        expect(runBestEffort).toHaveBeenCalledTimes(2);
        expect(runBestEffort).toHaveBeenNthCalledWith(1, expect.objectContaining({
            action: 'Failed to enqueue interview.scheduled notification intents',
            interviewId: 'interview-1',
            task: expect.any(Function)
        }));
        expect(runBestEffort).toHaveBeenNthCalledWith(2, expect.objectContaining({
            action: 'Failed to send invitation emails',
            interviewId: 'interview-1',
            task: expect.any(Function)
        }));
    });

    it('cancelInterview honors sendNotification=false and does not schedule cancellation emails', async () => {
        const before = {
            id: 'interview-1',
            organization_id: 'org-1',
            applicant_name: 'Jan',
            applicant_surname: 'Novak',
            applicant_id: 'applicant-1'
        };
        const after = {
            ...before,
            status: 'cancelled'
        };

        calendarRepository.getById
            .mockResolvedValueOnce(before)
            .mockResolvedValueOnce(after);
        calendarRepository.cancel.mockResolvedValue(after);

        const result = await lifecycle.cancelInterview('interview-1', 'Reason', 'user-1', {
            sendNotification: false
        });

        expect(result).toBe(after);
        expect(emitAudit).toHaveBeenCalledWith(expect.objectContaining({
            action: 'interview.cancel',
            metadata: expect.objectContaining({ sendNotification: false })
        }));
        expect(runBestEffort).toHaveBeenCalledTimes(1);
        expect(runBestEffort).toHaveBeenCalledWith(expect.objectContaining({
            action: 'Failed to enqueue interview.cancelled notification intent',
            interviewId: 'interview-1'
        }));
    });
});
