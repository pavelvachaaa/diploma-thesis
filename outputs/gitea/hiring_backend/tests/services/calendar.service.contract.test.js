const createCalendarService = require('../../src/domain/interviews/service');
const { createMockLogger } = require('../helpers');

const createDependencies = () => ({
    calendarRepository: {},
    logger: createMockLogger(),
    applicantsStatusCommandPort: {
        updateApplicantStatus: jest.fn()
    },
    applicantDocumentsQueryPort: {
        getApplicantAttachments: jest.fn()
    },
    sideEffectOutboxService: {
        isEnabled: jest.fn().mockReturnValue(false),
        enqueueRoleNotification: jest.fn(),
        enqueueUserNotification: jest.fn(),
        enqueue: jest.fn(),
        EVENT_TYPES: {
            RAW_EMAIL: 'email.raw.v1'
        },
        normalizeAttachmentsForPayload: jest.fn((value) => value),
        normalizeIcalEventForPayload: jest.fn((value) => value)
    }
});

describe('calendar.service API contract', () => {
    it('exposes the same calendar service API surface', () => {
        const service = createCalendarService(createDependencies());

        expect(Object.keys(service).sort()).toEqual([
            'addParticipants',
            'cancelInterview',
            'confirmAttendance',
            'createInterview',
            'deleteAttachment',
            'getAttachmentById',
            'getAttachments',
            'getInterviewById',
            'getInterviews',
            'getStatusHistory',
            'markCompleted',
            'markNoShow',
            'removeParticipant',
            'resendInvitation',
            'sendCancellationNotifications',
            'sendInvitationEmails',
            'sendInvitationToApplicant',
            'sendInvitationToParticipant',
            'sendReminderEmail',
            'sendReminders',
            'sendUpdateNotifications',
            'updateInterview',
            'uploadAttachment'
        ]);
    });
});
