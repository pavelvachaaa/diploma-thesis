const { createMockReq, createMockRes } = require('../helpers');
const createController = require('../../src/adapters/in/http/jobSeekers/controller');
const ApplicationError = require('../../src/core/shared/errors/ApplicationError');
const { ErrorCode } = require('../../src/core/shared/errors/ApplicationError');

const buildMocks = () => ({
    jobSeekersService: {
        createJobSeeker: jest.fn().mockResolvedValue({
            id: 'seeker-1',
            first_name: 'Pavel',
            last_name: 'Vacha',
            email: 'pavel@example.com',
            submitted_at: '2026-03-09T12:00:00.000Z'
        }),
        getAllJobSeekers: jest.fn(),
        getJobSeekerById: jest.fn(),
        deleteJobSeeker: jest.fn(),
        getJobSeekersByOrganization: jest.fn(),
        getAttachmentById: jest.fn(),
    },
    fileDownload: {
        downloadFile: jest.fn(),
    },
});

describe('jobSeekers controller', () => {
    let mocks;
    let controller;
    let res;
    let next;

    beforeEach(() => {
        jest.clearAllMocks();
        mocks = buildMocks();
        controller = createController(mocks);
        res = createMockRes();
        next = jest.fn();
    });

    it('parses JSON organizationIds and gdprConsent before delegating to the application layer', async () => {
        const req = createMockReq({
            body: {
                firstName: 'Pavel',
                lastName: 'Vacha',
                email: 'pavel@example.com',
                phone: '+420123456789',
                preferredPosition: 'Všeobecná sestra',
                organizationIds: JSON.stringify(['org-1', 'org-2']),
                gdprConsent: 'true'
            },
            files: {
                cv: [{ originalname: 'cv.pdf', key: 'job-seekers/cv.pdf', bucket: 'cv-uploads', mimetype: 'application/pdf', size: 1234 }],
                attachments: []
            }
        });

        await controller.submitJobSeekerForm(req, res, next);

        expect(mocks.jobSeekersService.createJobSeeker).toHaveBeenCalledWith(expect.objectContaining({
            organization_ids: ['org-1', 'org-2'],
            gdpr_consent: true
        }), expect.any(Object));
        expect(next).not.toHaveBeenCalled();
    });

    it('passes missing preferredPosition through to the application layer', async () => {
        const req = createMockReq({
            body: {
                firstName: 'Pavel',
                lastName: 'Vacha',
                email: 'pavel@example.com',
                phone: '+420123456789',
                organizationIds: JSON.stringify(['org-1']),
                gdprConsent: 'true'
            },
            files: {
                cv: [{ originalname: 'cv.pdf', key: 'job-seekers/cv.pdf', bucket: 'cv-uploads', mimetype: 'application/pdf', size: 1234 }],
                attachments: []
            }
        });

        await controller.submitJobSeekerForm(req, res, next);

        expect(mocks.jobSeekersService.createJobSeeker).toHaveBeenCalledWith(expect.objectContaining({
            preferred_position_name: undefined,
            organization_ids: ['org-1']
        }), expect.any(Object));
        expect(next).not.toHaveBeenCalled();
    });

    it('passes missing cv through to the application layer', async () => {
        const req = createMockReq({
            body: {
                firstName: 'Pavel',
                lastName: 'Vacha',
                email: 'pavel@example.com',
                phone: '+420123456789',
                preferredPosition: 'Všeobecná sestra',
                organizationIds: JSON.stringify(['org-1']),
                gdprConsent: 'true'
            },
            files: {
                attachments: []
            }
        });

        await controller.submitJobSeekerForm(req, res, next);

        expect(mocks.jobSeekersService.createJobSeeker).toHaveBeenCalledWith(expect.any(Object), expect.objectContaining({
            uploadedCv: null,
            uploadedAttachments: []
        }));
        expect(next).not.toHaveBeenCalled();
    });

    it('rejects submit when more than 4 additional attachments are provided', async () => {
        const req = createMockReq({
            body: {
                firstName: 'Pavel',
                lastName: 'Vacha',
                email: 'pavel@example.com',
                phone: '+420123456789',
                preferredPosition: 'Všeobecná sestra',
                organizationIds: JSON.stringify(['org-1']),
                gdprConsent: 'true'
            },
            files: {
                cv: [{ originalname: 'cv.pdf', key: 'job-seekers/cv.pdf', bucket: 'cv-uploads', mimetype: 'application/pdf', size: 1234 }],
                attachments: new Array(5).fill(null).map((_, idx) => ({
                    originalname: `file-${idx}.pdf`,
                    key: `job-seekers/file-${idx}.pdf`,
                    bucket: 'cv-uploads',
                    mimetype: 'application/pdf',
                    size: 1000 + idx
                }))
            }
        });

        await controller.submitJobSeekerForm(req, res, next);

        expect(mocks.jobSeekersService.createJobSeeker).toHaveBeenCalledWith(expect.any(Object), expect.objectContaining({
            uploadedAttachments: expect.arrayContaining([expect.objectContaining({ originalName: 'file-0.pdf' })])
        }));
        expect(next).not.toHaveBeenCalled();
    });

    it('submits valid payload with cv and additional attachments', async () => {
        const req = createMockReq({
            body: {
                firstName: 'Pavel',
                lastName: 'Vacha',
                email: 'pavel@example.com',
                phone: '+420123456789',
                preferredPosition: 'Všeobecná sestra',
                organizationIds: JSON.stringify(['org-1', 'org-2', 'org-1']),
                message: 'Hello',
                gdprConsent: 'true'
            },
            files: {
                cv: [{
                    originalname: 'cv.pdf',
                    key: 'job-seekers/cv.pdf',
                    bucket: 'cv-uploads',
                    mimetype: 'application/pdf',
                    size: 1234,
                    checksum_sha256: 'checksum-cv'
                }],
                attachments: [{
                    originalname: 'extra.docx',
                    key: 'job-seekers/extra.docx',
                    bucket: 'cv-uploads',
                    mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                    size: 999,
                    checksum_sha256: 'checksum-att'
                }]
            }
        });

        mocks.jobSeekersService.createJobSeeker.mockResolvedValue({
            id: 'seeker-1',
            first_name: 'Pavel',
            last_name: 'Vacha',
            email: 'pavel@example.com',
            submitted_at: '2026-03-09T12:00:00.000Z'
        });

        await controller.submitJobSeekerForm(req, res, next);

        expect(mocks.jobSeekersService.createJobSeeker).toHaveBeenCalledWith({
            first_name: 'Pavel',
            last_name: 'Vacha',
            email: 'pavel@example.com',
            phone: '+420123456789',
            organization_ids: ['org-1', 'org-2', 'org-1'],
            preferred_position_name: 'Všeobecná sestra',
            message: 'Hello',
            gdpr_consent: true
        }, {
            uploadedCv: expect.objectContaining({
                originalName: 'cv.pdf',
                key: 'job-seekers/cv.pdf',
                bucket: 'cv-uploads'
            }),
            uploadedAttachments: [
                expect.objectContaining({
                    originalName: 'extra.docx',
                    key: 'job-seekers/extra.docx',
                    bucket: 'cv-uploads'
                })
            ]
        });
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith({
            message: 'Job seeker form submitted successfully',
            jobSeeker: {
                id: 'seeker-1',
                first_name: 'Pavel',
                last_name: 'Vacha',
                email: 'pavel@example.com',
                submitted_at: '2026-03-09T12:00:00.000Z'
            }
        });
    });

    it('maps ApplicationError validation failures through handle()', async () => {
        const req = createMockReq({
            body: {
                firstName: 'Pavel',
                lastName: 'Vacha',
                email: 'pavel@example.com',
                phone: '+420123456789',
                preferredPosition: 'Všeobecná sestra',
                organizationIds: JSON.stringify(['org-1']),
                gdprConsent: 'true'
            },
            files: {
                cv: [{ originalname: 'cv.pdf', key: 'job-seekers/cv.pdf', bucket: 'cv-uploads', mimetype: 'application/pdf', size: 1234 }],
                attachments: []
            }
        });
        const error = new ApplicationError('At least one organization is required for job seeker submission', {
            code: ErrorCode.VALIDATION_ERROR
        });
        mocks.jobSeekersService.createJobSeeker.mockRejectedValue(error);

        await controller.submitJobSeekerForm(req, res, next);

        expect(next).toHaveBeenCalledWith(error);
        expect(next.mock.calls[0][0]).toHaveProperty('status', 400);
    });

    it('rejects non-JSON organizationIds string in the controller', async () => {
        const req = createMockReq({
            body: {
                firstName: 'Pavel',
                lastName: 'Vacha',
                email: 'pavel@example.com',
                phone: '+420123456789',
                preferredPosition: 'Všeobecná sestra',
                organizationIds: 'not-json',
                gdprConsent: 'true'
            },
            files: { cv: [], attachments: [] }
        });

        await controller.submitJobSeekerForm(req, res, next);

        expect(mocks.jobSeekersService.createJobSeeker).not.toHaveBeenCalled();
        expect(next).toHaveBeenCalledTimes(1);
        const forwarded = next.mock.calls[0][0];
        expect(forwarded.code).toBe(ErrorCode.VALIDATION_ERROR);
        expect(forwarded.status).toBe(400);
    });

    it('passes raw admin query values through to the application layer', async () => {
        const req = createMockReq({
            query: {
                page: '2',
                limit: '25',
                search: 'Pavel',
                organization: 'KZ',
                preferredPosition: 'Sestra',
                organizationId: 'org-1'
            },
            user: { id: 'admin-1' }
        });
        mocks.jobSeekersService.getAllJobSeekers.mockResolvedValue({ data: [], pagination: {} });

        await controller.getAllJobSeekersAdmin(req, res, next);

        expect(mocks.jobSeekersService.getAllJobSeekers).toHaveBeenCalledWith({
            page: '2',
            limit: '25',
            actorUserId: 'admin-1',
            minAccess: 'read',
            search: 'Pavel',
            organization: 'KZ',
            organizationId: 'org-1',
            preferredPosition: 'Sestra'
        });
        expect(res.json).toHaveBeenCalledWith({ data: [], pagination: {} });
    });

    it('downloads additional attachment for admin', async () => {
        const req = createMockReq({
            params: {
                id: 'seeker-1',
                attachmentId: 'att-1'
            },
            user: { id: 'admin-1' }
        });

        mocks.jobSeekersService.getAttachmentById.mockResolvedValue({
            id: 'att-1',
            file_path: 'job-seekers/extra.pdf',
            original_filename: 'extra.pdf',
            mime_type: 'application/pdf',
            bucket: 'cv-uploads'
        });

        await controller.downloadAttachmentAdmin(req, res, next);

        expect(mocks.fileDownload.downloadFile).toHaveBeenCalledWith(
            res,
            {
                file_path: 'job-seekers/extra.pdf',
                original_name: 'extra.pdf',
                mime_type: 'application/pdf',
                bucket: 'cv-uploads'
            },
            req.user,
            'job-seeker-attachment',
            expect.objectContaining({
                resourceId: 'seeker-1'
            })
        );
    });
});
