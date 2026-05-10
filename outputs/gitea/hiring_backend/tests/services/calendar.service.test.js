const { createMockLogger } = require('../helpers');

const createService = require('../../src/domain/interviews/service');

const buildMocks = () => ({
    calendarRepository: {
        getAttachments: jest.fn(),
        deleteAttachment: jest.fn(),
    },
    emailService: {},
    logger: createMockLogger(),
    mailer: {
        sendEmail: jest.fn(),
    },
    applicantsStatusCommandPort: {
        updateApplicantStatus: jest.fn()
    },
    applicantDocumentsQueryPort: {
        getApplicantAttachments: jest.fn()
    },
    attachmentsRepository: {},
    notificationService: {
        notifyUser: jest.fn(),
        notifyRoleInOrg: jest.fn(),
    },
    sideEffectOutboxService: {
        enqueueRoleNotification: jest.fn(),
        enqueueUserNotification: jest.fn(),
        enqueueFileGcDelete: jest.fn(),
        isEnabled: jest.fn(() => true),
        enqueue: jest.fn(),
        EVENT_TYPES: {
            RAW_EMAIL: 'email.raw.v1'
        },
        normalizeAttachmentsForPayload: jest.fn((value) => value),
        normalizeIcalEventForPayload: jest.fn((value) => value)
    },
    storageService: {
        download: jest.fn(),
    },
    fileGateway: {
        markRetained: jest.fn()
    },
    db: {
        getClient: jest.fn()
    }
});

describe('calendar.service', () => {
    let mocks;
    let service;

    beforeEach(() => {
        mocks = buildMocks();
        service = createService(mocks);
    });

    describe('sendInvitationToParticipant', () => {
        const interview = {
            id: 'interview-1',
            organization_id: 'org-1',
            title: 'Pohovor',
            scheduled_at: '2026-03-10T09:00:00.000Z',
            duration_minutes: 60,
            location_type: 'onsite',
            location: 'KZ',
            online_meeting_link: null,
            description: '',
            notes: '',
            job_title: 'Lekar',
            organization_name: 'KZ',
            creator_name: 'Eva',
            creator_surname: 'Nova',
            creator_email: 'eva@example.com',
            applicant_name: 'Jan',
            applicant_surname: 'Novak',
            applicant_email: 'jan@example.com',
            participants: [
                {
                    id: 'organizer-1',
                    role: 'organizer',
                    user_name: 'Eva',
                    user_surname: 'Nova',
                    user_email: 'eva@example.com',
                },
                {
                    id: 'participant-1',
                    role: 'interviewer',
                    user_name: 'Petr',
                    user_surname: 'Svoboda',
                    user_email: 'petr@example.com',
                },
            ],
        };

        const participant = {
            id: 'participant-1',
            role: 'interviewer',
            user_name: 'Petr',
            user_surname: 'Svoboda',
            user_email: 'petr@example.com',
        };

        it('queues participant invitation email through outbox with storage attachment references', async () => {
            mocks.calendarRepository.getAttachments.mockResolvedValue([
                {
                    file_path: 'applicant-attachments/cv.pdf',
                    original_filename: 'cv.pdf',
                    mime_type: 'application/pdf',
                },
            ]);
            mocks.sideEffectOutboxService.enqueue.mockResolvedValue({ id: 'outbox-1' });

            await service.sendInvitationToParticipant(interview, participant);

            expect(mocks.storageService.download).not.toHaveBeenCalled();
            expect(mocks.sideEffectOutboxService.enqueue).toHaveBeenCalledWith(
                expect.objectContaining({
                    eventType: 'email.raw.v1',
                    aggregateType: 'interview',
                    aggregateId: 'interview-1',
                    payload: expect.objectContaining({
                        to: 'petr@example.com',
                        attachments: [
                            expect.objectContaining({
                                filename: 'cv.pdf',
                                contentType: 'application/pdf',
                                storage: expect.objectContaining({
                                    bucket: 'attachments',
                                    key: 'applicant-attachments/cv.pdf'
                                })
                            }),
                        ],
                        audit: expect.objectContaining({
                            action: 'email.interview.invitation.participant',
                            resourceId: 'interview-1'
                        })
                    })
                }),
                expect.objectContaining({
                    idempotencyKey: null
                })
            );
        });
    });

    describe('deleteAttachment', () => {
        it('marks deleted attachment file as retained and enqueues GC event', async () => {
            const txClient = {
                query: jest.fn(),
                release: jest.fn()
            };
            txClient.query
                .mockResolvedValueOnce({}) // BEGIN
                .mockResolvedValueOnce({}); // COMMIT

            mocks.calendarRepository.deleteAttachment.mockResolvedValue({
                id: 'att-1',
                file_id: 'file-1',
            });
            mocks.fileGateway.markRetained.mockResolvedValue({
                id: 'file-1',
                retention_until: '2026-04-01T00:00:00.000Z'
            });
            mocks.sideEffectOutboxService.enqueueFileGcDelete.mockResolvedValue({ id: 'outbox-1' });
            mocks.db.getClient.mockResolvedValue(txClient);

            const result = await service.deleteAttachment('att-1', 'user-1');

            expect(result).toBe(true);
            expect(mocks.fileGateway.markRetained).toHaveBeenCalledWith('file-1', expect.objectContaining({
                client: txClient
            }));
            expect(mocks.sideEffectOutboxService.enqueueFileGcDelete).toHaveBeenCalledWith(
                expect.objectContaining({
                    fileId: 'file-1',
                    sourceModule: 'interviews.deleteAttachment'
                }),
                expect.objectContaining({
                    client: txClient
                })
            );
        });
    });
});
