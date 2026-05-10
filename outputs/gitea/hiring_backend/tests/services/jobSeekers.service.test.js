const createJobSeekersService = require('../../src/core/jobSeekers/application');
const createFileGcAdapter = require('../../src/adapters/out/integration/jobSeekers/fileGc');
const { ErrorCode } = require('../../src/core/shared/errors/ApplicationError');

describe('jobSeekers service', () => {
    const createDeps = () => {
        let fileCounter = 0;
        const jobSeekersStorePort = {
            withTransaction: jest.fn(async (callback) => callback({ query: jest.fn() })),
            createJobSeeker: jest.fn(async () => ({ id: 'seeker-1' })),
            createJobSeekerLocations: jest.fn(async () => []),
            createJobSeekerAttachments: jest.fn(async () => []),
            getAllJobSeekers: jest.fn(async () => ({ data: [], pagination: {} })),
            getJobSeekerById: jest.fn(async () => ({
                id: 'seeker-1',
                organization_ids: ['org-1'],
                cv_file_path: 'job-seekers/cv.pdf'
            })),
            getDeleteMetadata: jest.fn(),
            deleteJobSeeker: jest.fn(),
        };
        const fileGateway = {
            createFileRecord: jest.fn(async (payload) => {
                fileCounter += 1;
                return {
                    id: `file-${fileCounter}`,
                    object_key: payload.objectKey,
                    bucket: payload.bucket
                };
            }),
            markRetained: jest.fn()
        };

        const sideEffectOutboxService = {
            enqueue: jest.fn(async () => ({ id: 'outbox-1' }))
        };

        const cvIntentPort = {
            queueJobSeekerCvPublishIntent: jest.fn(async () => ({ id: 'outbox-cv-1' }))
        };

        const logger = {
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn()
        };

        return {
            service: createJobSeekersService({
                jobSeekersStorePort,
                jobSeekersFilePort: fileGateway,
                jobSeekersFileGcPort: createFileGcAdapter({ sideEffectOutboxService }),
                jobSeekersOrganizationLookupPort: {
                    getById: jest.fn(async (id) => ({ id }))
                },
                cvIntentPort,
                logger
            }),
            jobSeekersRepository: jobSeekersStorePort,
            fileGateway,
            sideEffectOutboxService,
            cvIntentPort
        };
    };

    it('rejects unsupported cv mime type', async () => {
        const { service, jobSeekersRepository } = createDeps();

        await expect(service.createJobSeeker({
            first_name: 'Pavel',
            last_name: 'Vacha',
            email: 'pavel@example.com',
            phone: '+420123456789',
            organization_ids: ['org-1'],
            preferred_position_name: 'Všeobecná sestra',
            gdpr_consent: true
        }, {
            uploadedCv: {
                bucket: 'cv-uploads',
                key: 'job-seekers/cv.exe',
                mimetype: 'application/x-msdownload',
                originalName: 'cv.exe',
                size: 123
            },
            uploadedAttachments: []
        })).rejects.toMatchObject({
            code: ErrorCode.VALIDATION_ERROR,
            message: 'Unsupported CV file type'
        });

        expect(jobSeekersRepository.withTransaction).not.toHaveBeenCalled();
    });

    it('rejects when more than 4 additional attachments are provided', async () => {
        const { service, jobSeekersRepository } = createDeps();

        const uploadedAttachments = new Array(5).fill(null).map((_, idx) => ({
            bucket: 'cv-uploads',
            key: `job-seekers/att-${idx}.pdf`,
            mimetype: 'application/pdf',
            originalName: `att-${idx}.pdf`,
            size: 1000 + idx
        }));

        await expect(service.createJobSeeker({
            first_name: 'Pavel',
            last_name: 'Vacha',
            email: 'pavel@example.com',
            phone: '+420123456789',
            organization_ids: ['org-1'],
            preferred_position_name: 'Všeobecná sestra',
            gdpr_consent: true
        }, {
            uploadedCv: {
                bucket: 'cv-uploads',
                key: 'job-seekers/cv.pdf',
                mimetype: 'application/pdf',
                originalName: 'cv.pdf',
                size: 123
            },
            uploadedAttachments
        })).rejects.toMatchObject({
            code: ErrorCode.VALIDATION_ERROR,
            message: 'A maximum of 4 additional attachments is allowed'
        });

        expect(jobSeekersRepository.withTransaction).not.toHaveBeenCalled();
    });

    it('creates seeker, locations, attachments and queues cv publish intent transactionally', async () => {
        const { service, jobSeekersRepository, cvIntentPort } = createDeps();

        const result = await service.createJobSeeker({
            first_name: 'Pavel',
            last_name: 'Vacha',
            email: 'pavel@example.com',
            phone: '+420123456789',
            organization_ids: ['org-1', 'org-2'],
            preferred_position_name: 'Všeobecná sestra',
            gdpr_consent: true
        }, {
            uploadedCv: {
                bucket: 'cv-uploads',
                key: 'job-seekers/cv.pdf',
                mimetype: 'application/pdf',
                originalName: 'cv.pdf',
                size: 123
            },
            uploadedAttachments: [{
                bucket: 'cv-uploads',
                key: 'job-seekers/extra.pdf',
                mimetype: 'application/pdf',
                originalName: 'extra.pdf',
                size: 111
            }],
            requestId: 'req-1'
        });

        expect(jobSeekersRepository.withTransaction).toHaveBeenCalledTimes(1);
        expect(jobSeekersRepository.createJobSeeker).toHaveBeenCalledTimes(1);
        expect(jobSeekersRepository.createJobSeeker).toHaveBeenCalledWith(expect.objectContaining({
            preferred_position_name: 'Všeobecná sestra',
            preferred_position_key: 'vseobecna sestra'
        }), expect.any(Object));
        expect(jobSeekersRepository.createJobSeekerLocations).toHaveBeenCalledWith('seeker-1', ['org-1', 'org-2'], expect.any(Object));
        expect(jobSeekersRepository.createJobSeekerAttachments).toHaveBeenCalledWith('seeker-1', ['file-2'], expect.any(Object));
        expect(cvIntentPort.queueJobSeekerCvPublishIntent).toHaveBeenCalledWith(expect.objectContaining({
            requestId: 'req-1',
            jobSeeker: expect.objectContaining({
                id: 'seeker-1',
                organization_ids: ['org-1', 'org-2']
            })
        }), expect.any(Object));
        expect(result).toEqual(expect.objectContaining({ id: 'seeker-1' }));
    });

    it('enqueues rollback cleanup for uploaded files when transaction fails', async () => {
        const { service, jobSeekersRepository, sideEffectOutboxService } = createDeps();

        jobSeekersRepository.withTransaction.mockImplementationOnce(async (callback) => {
            await callback({ query: jest.fn() });
            throw new Error('tx failure');
        });

        await expect(service.createJobSeeker({
            first_name: 'Pavel',
            last_name: 'Vacha',
            email: 'pavel@example.com',
            phone: '+420123456789',
            organization_ids: ['org-1'],
            preferred_position_name: 'Všeobecná sestra',
            gdpr_consent: true
        }, {
            uploadedCv: {
                bucket: 'cv-uploads',
                key: 'job-seekers/cv.pdf',
                mimetype: 'application/pdf',
                originalName: 'cv.pdf',
                size: 123
            },
            uploadedAttachments: [{
                bucket: 'cv-uploads',
                key: 'job-seekers/extra.pdf',
                mimetype: 'application/pdf',
                originalName: 'extra.pdf',
                size: 111
            }]
        })).rejects.toThrow('tx failure');

        expect(sideEffectOutboxService.enqueue).toHaveBeenCalledTimes(2);
    });

    it('rejects when preferred position is missing', async () => {
        const { service, jobSeekersRepository } = createDeps();

        await expect(service.createJobSeeker({
            first_name: 'Pavel',
            last_name: 'Vacha',
            email: 'pavel@example.com',
            phone: '+420123456789',
            organization_ids: ['org-1'],
            gdpr_consent: true
        }, {
            uploadedCv: {
                bucket: 'cv-uploads',
                key: 'job-seekers/cv.pdf',
                mimetype: 'application/pdf',
                originalName: 'cv.pdf',
                size: 123
            },
            uploadedAttachments: []
        })).rejects.toMatchObject({
            code: ErrorCode.VALIDATION_ERROR,
            message: 'Preferred position is required for job seeker submission'
        });

        expect(jobSeekersRepository.withTransaction).not.toHaveBeenCalled();
    });

    it('normalizes preferredPosition filter for listing', async () => {
        const { service, jobSeekersRepository } = createDeps();

        await service.getAllJobSeekers({
            page: 1,
            limit: 10,
            actorUserId: 'user-1',
            organizationId: 'org-1',
            search: '',
            organization: '',
            preferredPosition: '  Všeobecná   sestra '
        });

        expect(jobSeekersRepository.getAllJobSeekers).toHaveBeenCalledWith(expect.objectContaining({
            page: 1,
            limit: 10,
            actorUserId: 'user-1',
            organizationId: 'org-1',
            search: '',
            organization: '',
            preferredPositionKey: 'vseobecna sestra'
        }));
    });
});
