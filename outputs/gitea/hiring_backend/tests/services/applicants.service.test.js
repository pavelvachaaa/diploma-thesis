const { createMockDb } = require('../helpers');

const mockWriteAuditEvent = jest.fn().mockResolvedValue();
jest.mock('@platform/audit', () => ({
    writeAuditEvent: (...args) => mockWriteAuditEvent(...args)
}));

const createService = require('../../src/domain/applicants/service');

const buildMocks = () => {
    const db = createMockDb();
    db._mockClient.query.mockResolvedValue({});

    return {
        db,
        applicantsRepository: {
            createApplicant: jest.fn(),
            updateApplicantStatus: jest.fn(),
            getAllApplicants: jest.fn(),
            getApplicantsByJobId: jest.fn(),
            getApplicantById: jest.fn()
        },
        statusRepository: {
            createStatusHistory: jest.fn(),
            getStatusByName: jest.fn(),
            getStatusHistoryByApplicantId: jest.fn(),
            getAllStatuses: jest.fn()
        },
        notesRepository: {
            createNote: jest.fn(),
            getNotesByApplicantId: jest.fn(),
            updateNote: jest.fn(),
            deleteNote: jest.fn(),
            getDefaultAdminAuthorId: jest.fn()
        },
        attachmentsRepository: {
            getByApplicantId: jest.fn(),
            getById: jest.fn(),
            updateStatus: jest.fn(),
            getAllStatuses: jest.fn()
        },
        jobsRepository: {
            getJobById: jest.fn()
        },
        applicantEmailPort: {
            sendApplicantEmail: jest.fn().mockResolvedValue({ success: true }),
            sendInterviewInvitation: jest.fn().mockResolvedValue({ success: true })
        },
        sideEffectOutboxService: {
            EVENT_TYPES: {
                RAW_EMAIL: 'email.raw.v1',
                ROLE_NOTIFICATION: 'notification.role.v1'
            },
            enqueue: jest.fn().mockResolvedValue({ id: 'side-effect-outbox-1' })
        },
        audit: {
            writeAuditEvent: (...args) => mockWriteAuditEvent(...args)
        }
    };
};

describe('applicants.service', () => {
    let mocks;
    let service;

    beforeEach(() => {
        mocks = buildMocks();
        service = createService(mocks);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('createApplicant', () => {
        const applicantData = {
            name: 'Jan',
            surname: 'Novák',
            email: 'jan@example.com',
            phone: '123456789',
            job_posting_id: 'job-uuid-1',
            organization_id: 'org-uuid-1'
        };

        const createdApplicant = {
            id: 'applicant-uuid-1',
            ...applicantData,
            current_status: 'submitted'
        };

        beforeEach(() => {
            mocks.applicantsRepository.createApplicant.mockResolvedValue(createdApplicant);
            mocks.statusRepository.createStatusHistory.mockResolvedValue({ id: 'history-1' });
            mocks.jobsRepository.getJobById.mockResolvedValue({ id: 'job-uuid-1', title: 'Nurse' });
        });

        it('sets current_status to submitted regardless of input', async () => {
            await service.createApplicant({ ...applicantData, current_status: 'accepted' });

            expect(mocks.applicantsRepository.createApplicant).toHaveBeenCalledWith(
                expect.objectContaining({ current_status: 'submitted' }),
                expect.objectContaining({ client: mocks.db._mockClient })
            );
        });

        it('creates initial status history and queues notification + email in one transaction', async () => {
            const result = await service.createApplicant(applicantData);

            expect(result).toEqual(createdApplicant);
            expect(mocks.db._mockClient.query).toHaveBeenNthCalledWith(1, 'BEGIN');
            expect(mocks.statusRepository.createStatusHistory).toHaveBeenCalledWith({
                applicant_id: createdApplicant.id,
                status_name: 'submitted',
                changed_by: null,
                notes: 'Přihláška byla automaticky odeslána'
            }, expect.objectContaining({ client: mocks.db._mockClient }));

            expect(mocks.sideEffectOutboxService.enqueue).toHaveBeenCalledWith(
                expect.objectContaining({
                    eventType: 'notification.role.v1',
                    organizationId: createdApplicant.organization_id,
                    aggregateType: 'applicant',
                    aggregateId: createdApplicant.id
                }),
                expect.objectContaining({
                    client: mocks.db._mockClient
                })
            );

            expect(mocks.sideEffectOutboxService.enqueue).toHaveBeenCalledWith(
                expect.objectContaining({
                    eventType: 'email.raw.v1',
                    aggregateType: 'applicant',
                    aggregateId: createdApplicant.id
                }),
                expect.objectContaining({
                    client: mocks.db._mockClient
                })
            );

            expect(mocks.sideEffectOutboxService.enqueue).toHaveBeenCalledTimes(2);
            expect(mocks.db._mockClient.query).toHaveBeenLastCalledWith('COMMIT');
        });

        it('does not queue application received email if job is missing', async () => {
            mocks.jobsRepository.getJobById.mockResolvedValue(null);

            await service.createApplicant(applicantData);

            expect(mocks.sideEffectOutboxService.enqueue).toHaveBeenCalledTimes(1);
            expect(mocks.sideEffectOutboxService.enqueue).toHaveBeenCalledWith(
                expect.objectContaining({
                    eventType: 'notification.role.v1'
                }),
                expect.objectContaining({
                    client: mocks.db._mockClient
                })
            );
        });

        it('rolls back when outbox enqueue fails', async () => {
            mocks.sideEffectOutboxService.enqueue.mockRejectedValueOnce(new Error('outbox down'));

            await expect(service.createApplicant(applicantData)).rejects.toThrow('outbox down');
            expect(mocks.db._mockClient.query).toHaveBeenCalledWith('ROLLBACK');
            expect(mockWriteAuditEvent).not.toHaveBeenCalled();
        });
    });

    describe('updateApplicantStatus', () => {
        const applicantId = 'applicant-uuid-1';
        const beforeApplicant = {
            id: applicantId,
            name: 'Jan',
            surname: 'Novák',
            job_posting_id: 'job-uuid-1',
            current_status: 'submitted',
            organization_id: 'org-uuid-1'
        };

        const updatedApplicant = {
            ...beforeApplicant,
            current_status: 'under_review'
        };

        beforeEach(() => {
            mocks.statusRepository.getStatusByName.mockResolvedValue({ name: 'under_review' });
            mocks.applicantsRepository.getApplicantById
                .mockResolvedValueOnce(beforeApplicant)
                .mockResolvedValueOnce(updatedApplicant);
            mocks.applicantsRepository.updateApplicantStatus.mockResolvedValue(updatedApplicant);
            mocks.statusRepository.createStatusHistory.mockResolvedValue({ id: 'history-2' });
            mocks.jobsRepository.getJobById.mockResolvedValue({
                id: 'job-uuid-1',
                title: 'Nurse',
                organization_name: 'KZCR'
            });
        });

        it('throws and rolls back if status is invalid', async () => {
            mocks.statusRepository.getStatusByName.mockResolvedValue(null);

            await expect(service.updateApplicantStatus(applicantId, 'invalid_status')).rejects.toThrow("Status 'invalid_status' not found");
            expect(mocks.db._mockClient.query).toHaveBeenCalledWith('ROLLBACK');
            expect(mocks.sideEffectOutboxService.enqueue).not.toHaveBeenCalled();
        });

        it('updates status and queues under_review email + HR notification transactionally', async () => {
            const result = await service.updateApplicantStatus(applicantId, 'under_review', 'user-1', 'Review started');

            expect(result).toEqual(updatedApplicant);
            expect(mocks.applicantsRepository.updateApplicantStatus).toHaveBeenCalledWith(
                applicantId,
                'under_review',
                expect.objectContaining({ client: mocks.db._mockClient })
            );
            expect(mocks.statusRepository.createStatusHistory).toHaveBeenCalledWith({
                applicant_id: applicantId,
                status_name: 'under_review',
                changed_by: 'user-1',
                notes: 'Review started'
            }, expect.objectContaining({ client: mocks.db._mockClient }));

            expect(mocks.sideEffectOutboxService.enqueue).toHaveBeenCalledTimes(2);
            expect(mocks.db._mockClient.query).toHaveBeenLastCalledWith('COMMIT');
        });

        it('queues rejection email when status is rejected', async () => {
            const rejectedApplicant = { ...beforeApplicant, current_status: 'rejected' };
            mocks.statusRepository.getStatusByName.mockResolvedValue({ name: 'rejected' });
            mocks.applicantsRepository.getApplicantById
                .mockResolvedValueOnce(beforeApplicant)
                .mockResolvedValueOnce(rejectedApplicant);
            mocks.applicantsRepository.updateApplicantStatus.mockResolvedValue(rejectedApplicant);

            await service.updateApplicantStatus(applicantId, 'rejected', 'user-1', 'Not qualified');

            expect(mocks.sideEffectOutboxService.enqueue).toHaveBeenCalledTimes(2);
        });

        it('does not queue applicant email for statuses without external email', async () => {
            const acceptedApplicant = { ...beforeApplicant, current_status: 'accepted' };
            mocks.statusRepository.getStatusByName.mockResolvedValue({ name: 'accepted' });
            mocks.applicantsRepository.getApplicantById.mockResolvedValueOnce(beforeApplicant);
            mocks.applicantsRepository.updateApplicantStatus.mockResolvedValue(acceptedApplicant);
            mocks.statusRepository.createStatusHistory.mockResolvedValue({ id: 'history-3' });

            await service.updateApplicantStatus(applicantId, 'accepted');

            expect(mocks.sideEffectOutboxService.enqueue).toHaveBeenCalledTimes(1);
        });

        it('rolls back when outbox enqueue fails', async () => {
            mocks.sideEffectOutboxService.enqueue.mockRejectedValueOnce(new Error('notification outbox down'));

            await expect(service.updateApplicantStatus(applicantId, 'under_review')).rejects.toThrow('notification outbox down');
            expect(mocks.db._mockClient.query).toHaveBeenCalledWith('ROLLBACK');
            expect(mockWriteAuditEvent).not.toHaveBeenCalledWith(expect.objectContaining({
                action: 'applicant.status.update'
            }));
        });
    });

    describe('createApplicantNote', () => {
        it('passes noteData directly to repository when author_id is present', async () => {
            const noteData = { applicant_id: 'app-1', author_id: 'user-1', note: 'Good candidate' };
            mocks.notesRepository.createNote.mockResolvedValue({ id: 'note-1', ...noteData });
            mocks.applicantsRepository.getApplicantById.mockResolvedValue({ id: 'app-1', organization_id: 'org-1' });

            const result = await service.createApplicantNote(noteData);

            expect(mocks.notesRepository.createNote).toHaveBeenCalledWith(noteData, {});
            expect(result).toEqual(expect.objectContaining({ note: 'Good candidate' }));
        });
    });

    describe('pass-through methods', () => {
        it('getAllApplicants forwards params to repository', async () => {
            const expected = { applicants: [], total: 0 };
            mocks.applicantsRepository.getAllApplicants.mockResolvedValue(expected);

            const result = await service.getAllApplicants(1, 10, 'org-1', 'search', 'submitted', 'Org Name');

            expect(mocks.applicantsRepository.getAllApplicants).toHaveBeenCalledWith(
                {
                    page: 1,
                    limit: 10,
                    organizationId: 'org-1',
                    search: 'search',
                    status: 'submitted',
                    organizationName: 'Org Name'
                }
            );
            expect(result).toEqual(expected);
        });

        it('getApplicantById delegates to repository', async () => {
            const applicant = { id: 'app-1', name: 'Jan' };
            mocks.applicantsRepository.getApplicantById.mockResolvedValue(applicant);

            const result = await service.getApplicantById('app-1');

            expect(mocks.applicantsRepository.getApplicantById).toHaveBeenCalledWith('app-1', {});
            expect(result).toEqual(applicant);
        });

        it('getAttachmentsByApplicantId delegates to repository', async () => {
            const attachments = [{ id: 'att-1' }];
            mocks.attachmentsRepository.getByApplicantId.mockResolvedValue(attachments);

            const result = await service.getAttachmentsByApplicantId('app-1');

            expect(mocks.attachmentsRepository.getByApplicantId).toHaveBeenCalledWith('app-1', {});
            expect(result).toEqual(attachments);
        });

        it('updateAttachmentStatus delegates to repository', async () => {
            const statusData = { status: 'approved', reviewed_by: 'user-1' };
            mocks.attachmentsRepository.getById.mockResolvedValue({
                id: 'att-1',
                applicant_id: 'app-1',
                status: 'pending'
            });
            mocks.attachmentsRepository.updateStatus.mockResolvedValue({ id: 'att-1', applicant_id: 'app-1', ...statusData });
            mocks.applicantsRepository.getApplicantById.mockResolvedValue({ id: 'app-1', organization_id: 'org-1' });

            const result = await service.updateAttachmentStatus('att-1', statusData);

            expect(mocks.attachmentsRepository.updateStatus).toHaveBeenCalledWith('att-1', statusData, {});
            expect(result).toEqual(expect.objectContaining({ status: 'approved' }));
        });

        it('updateApplicantNote delegates to repository', async () => {
            mocks.notesRepository.getNoteById = jest.fn().mockResolvedValue({ id: 'note-1', applicant_id: 'app-1', note: 'Old' });
            mocks.notesRepository.updateNote.mockResolvedValue({ id: 'note-1', applicant_id: 'app-1', note: 'Updated' });
            mocks.applicantsRepository.getApplicantById.mockResolvedValue({ id: 'app-1', organization_id: 'org-1' });

            const result = await service.updateApplicantNote('note-1', 'Updated');

            expect(mocks.notesRepository.updateNote).toHaveBeenCalledWith('note-1', 'Updated', {});
            expect(result).toEqual(expect.objectContaining({ note: 'Updated' }));
        });

        it('deleteApplicantNote delegates to repository', async () => {
            mocks.notesRepository.getNoteById = jest.fn().mockResolvedValue({ id: 'note-1', applicant_id: 'app-1', note: 'Old' });
            mocks.notesRepository.deleteNote.mockResolvedValue({ id: 'note-1', applicant_id: 'app-1' });
            mocks.applicantsRepository.getApplicantById.mockResolvedValue({ id: 'app-1', organization_id: 'org-1' });

            const result = await service.deleteApplicantNote('note-1');

            expect(mocks.notesRepository.deleteNote).toHaveBeenCalledWith('note-1', {});
            expect(result).toEqual({ id: 'note-1', applicant_id: 'app-1' });
        });

        it('getApplicantsByJobId delegates to repository', async () => {
            const applicants = [{ id: 'app-1' }];
            mocks.applicantsRepository.getApplicantsByJobId.mockResolvedValue(applicants);

            const result = await service.getApplicantsByJobId('job-1');

            expect(mocks.applicantsRepository.getApplicantsByJobId).toHaveBeenCalledWith('job-1', {});
            expect(result).toEqual(applicants);
        });

        it('getApplicantStatusHistory delegates to statusRepository', async () => {
            const history = [{ status_name: 'submitted' }];
            mocks.statusRepository.getStatusHistoryByApplicantId.mockResolvedValue(history);

            const result = await service.getApplicantStatusHistory('app-1');

            expect(mocks.statusRepository.getStatusHistoryByApplicantId).toHaveBeenCalledWith('app-1', {});
            expect(result).toEqual(history);
        });

        it('getAllStatuses delegates to statusRepository', async () => {
            const statuses = [{ name: 'submitted' }, { name: 'rejected' }];
            mocks.statusRepository.getAllStatuses.mockResolvedValue(statuses);

            const result = await service.getAllStatuses();

            expect(mocks.statusRepository.getAllStatuses).toHaveBeenCalled();
            expect(result).toEqual(statuses);
        });
    });

    describe('communication methods', () => {
        describe('sendEmailToApplicant', () => {
            it('returns 400 when message is missing', async () => {
                const result = await service.sendEmailToApplicant('app-1', {
                    message: '   ',
                    senderUser: { name: 'HR', surname: 'User' },
                    files: []
                });

                expect(result).toEqual({
                    statusCode: 400,
                    body: { message: 'Email message is required' }
                });
            });

            it('returns 404 when applicant is missing', async () => {
                mocks.applicantsRepository.getApplicantById.mockResolvedValue(null);

                const result = await service.sendEmailToApplicant('missing', {
                    message: 'Hello',
                    senderUser: { name: 'HR', surname: 'User' },
                    files: []
                });

                expect(result).toEqual({
                    statusCode: 404,
                    body: { message: 'Applicant not found' }
                });
            });

            it('maps attachments and returns success payload', async () => {
                mocks.applicantsRepository.getApplicantById.mockResolvedValue({
                    id: 'app-1',
                    email: 'jan@example.com',
                    name: 'Jan',
                    surname: 'Novák'
                });
                mocks.applicantEmailPort.sendApplicantEmail.mockResolvedValue({ success: true });

                const result = await service.sendEmailToApplicant('app-1', {
                    message: 'Ahoj',
                    senderUser: { name: 'Eva', surname: 'HR' },
                    files: [{
                        originalname: 'note.pdf',
                        mimetype: 'application/pdf',
                        key: 'applicant-attachments/note.pdf',
                        bucket: 'attachments'
                    }]
                });

                expect(mocks.applicantEmailPort.sendApplicantEmail).toHaveBeenCalledWith(expect.objectContaining({
                    applicantEmail: 'jan@example.com',
                    applicantName: 'Jan Novák',
                    senderName: 'Eva HR',
                    attachments: [expect.objectContaining({
                        filename: 'note.pdf',
                        contentType: 'application/pdf',
                        storage: {
                            bucket: 'attachments',
                            key: 'applicant-attachments/note.pdf'
                        }
                    })]
                }));
                expect(result).toEqual({
                    statusCode: 200,
                    body: {
                        success: true,
                        message: 'Email byl úspěšně odeslán uchazeči'
                    }
                });
            });

            it('returns 500 payload on email dispatch failure', async () => {
                mocks.applicantsRepository.getApplicantById.mockResolvedValue({
                    id: 'app-1',
                    email: 'jan@example.com',
                    name: 'Jan',
                    surname: 'Novák'
                });
                mocks.applicantEmailPort.sendApplicantEmail.mockResolvedValue({
                    success: false,
                    error: 'smtp down'
                });

                const result = await service.sendEmailToApplicant('app-1', {
                    message: 'Ahoj',
                    senderUser: { name: 'Eva', surname: 'HR' },
                    files: []
                });

                expect(result).toEqual({
                    statusCode: 500,
                    body: {
                        success: false,
                        message: 'Nepodařilo se odeslat email uchazeči',
                        error: 'smtp down'
                    }
                });
            });
        });

        describe('scheduleInterviewInvitation', () => {
            it('returns 400 when required input is missing', async () => {
                const result = await service.scheduleInterviewInvitation('app-1', {
                    dateTime: null,
                    location: 'Most'
                });

                expect(result).toEqual({
                    statusCode: 400,
                    body: { message: 'Date/time and location are required' }
                });
            });

            it('returns 404 when applicant is missing', async () => {
                mocks.applicantsRepository.getApplicantById.mockResolvedValue(null);

                const result = await service.scheduleInterviewInvitation('app-1', {
                    dateTime: '2026-03-10T10:00:00.000Z',
                    location: 'Most'
                });

                expect(result).toEqual({
                    statusCode: 404,
                    body: { message: 'Applicant not found' }
                });
            });

            it('returns success payload on invitation dispatch', async () => {
                mocks.applicantsRepository.getApplicantById.mockResolvedValue({
                    id: 'app-1',
                    email: 'jan@example.com',
                    name: 'Jan',
                    surname: 'Novák',
                    organization_name: 'Krajská Zdravotní a.s.',
                    job_title: 'Sestra'
                });
                mocks.applicantEmailPort.sendInterviewInvitation.mockResolvedValue({
                    success: true,
                    messageId: 'msg-1',
                    sentTo: 'jan@example.com'
                });

                const result = await service.scheduleInterviewInvitation('app-1', {
                    dateTime: '2026-03-10T10:00:00.000Z',
                    location: 'Most',
                    locationType: 'office',
                    participants: 'HR Team',
                    notes: 'Bring CV'
                });

                expect(mocks.applicantEmailPort.sendInterviewInvitation).toHaveBeenCalledWith(expect.objectContaining({
                    applicantEmail: 'jan@example.com',
                    applicantName: 'Jan Novák'
                }));
                expect(result).toEqual({
                    statusCode: 200,
                    body: {
                        success: true,
                        message: 'Pozvánka na pohovor byla odeslána',
                        messageId: 'msg-1',
                        sentTo: 'jan@example.com'
                    }
                });
            });

            it('returns 500 payload when invitation dispatch fails', async () => {
                mocks.applicantsRepository.getApplicantById.mockResolvedValue({
                    id: 'app-1',
                    email: 'jan@example.com',
                    name: 'Jan',
                    surname: 'Novák'
                });
                mocks.applicantEmailPort.sendInterviewInvitation.mockResolvedValue({
                    success: false,
                    error: 'queue unavailable'
                });

                const result = await service.scheduleInterviewInvitation('app-1', {
                    dateTime: '2026-03-10T10:00:00.000Z',
                    location: 'Most'
                });

                expect(result).toEqual({
                    statusCode: 500,
                    body: {
                        success: false,
                        message: 'Nepodařilo se odeslat pozvánku na pohovor',
                        error: 'queue unavailable'
                    }
                });
            });
        });
    });
});
