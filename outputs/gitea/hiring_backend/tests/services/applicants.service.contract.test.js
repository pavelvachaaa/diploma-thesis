const createApplicantsService = require('../../src/domain/applicants/service');

const createDependencies = () => ({
    db: {
        getClient: jest.fn().mockResolvedValue({
            query: jest.fn().mockResolvedValue({}),
            release: jest.fn()
        }),
        query: jest.fn().mockResolvedValue({ rows: [] })
    },
    applicantsRepository: {},
    attachmentsRepository: {},
    statusRepository: {},
    notesRepository: {},
    jobsRepository: {},
    applicantEmailPort: {},
    sideEffectOutboxService: {}
});

describe('applicants.service API contract', () => {
    it('exposes the same applicants service API surface', () => {
        const service = createApplicantsService(createDependencies());

        expect(Object.keys(service).sort()).toEqual([
            'createApplicant',
            'createApplicantNote',
            'deleteApplicantNote',
            'getAllApplicants',
            'getAllDocumentStatuses',
            'getAllStatuses',
            'getApplicantById',
            'getApplicantNotes',
            'getApplicantStatusHistory',
            'getApplicantsByJobId',
            'getAttachmentById',
            'getAttachmentsByApplicantId',
            'scheduleInterviewInvitation',
            'sendEmailToApplicant',
            'updateApplicantNote',
            'updateApplicantStatus',
            'updateAttachmentStatus'
        ]);
    });
});
