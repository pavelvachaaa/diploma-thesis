const createOnboardingDocumentsService = require('../../src/domain/onboardingDocuments/service');
const { createMockLogger } = require('../helpers');

const buildMocks = () => ({
    onboardingDocumentsRepository: {
        withTransaction: jest.fn(async (callback) => callback({ query: jest.fn() })),
        upsertUserDocument: jest.fn(),
        getUserOrganization: jest.fn(),
        getById: jest.fn().mockResolvedValue(null),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn()
    },
    sideEffectOutboxService: {
        enqueue: jest.fn(),
        enqueueRoleNotification: jest.fn(),
        enqueueFileGcDelete: jest.fn()
    },
    membershipAccessPort: {
        ensureMembershipCreateAccess: jest.fn().mockResolvedValue({ granted: true })
    },
    fileGateway: {
        createFileRecord: jest.fn().mockResolvedValue({ id: 'file-1' }),
        markRetained: jest.fn().mockResolvedValue({ id: 'file-old', retention_until: '2026-04-01T00:00:00.000Z' })
    },
    logger: createMockLogger()
});

describe('onboardingDocuments.service', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('storeUserDocument queues role notification outbox event in transaction', async () => {
        const mocks = buildMocks();
        mocks.onboardingDocumentsRepository.upsertUserDocument.mockResolvedValue({
            document: { id: 'ud-1' },
            oldFileId: 'file-old'
        });
        mocks.onboardingDocumentsRepository.getUserOrganization.mockResolvedValue('org-1');
        mocks.sideEffectOutboxService.enqueueRoleNotification.mockResolvedValue({ id: 'outbox-1' });

        const service = createOnboardingDocumentsService(mocks);
        const result = await service.storeUserDocument('user-1', 'doc-1', {
            filename: 'new.pdf',
            originalName: 'new.pdf',
            key: 'user-documents/new.pdf',
            bucket: 'documents',
            mimetype: 'application/pdf',
            size: 123,
            checksum_sha256: 'deadbeef'
        });

        expect(result).toEqual({ id: 'ud-1' });
        expect(mocks.fileGateway.createFileRecord).toHaveBeenCalledWith(expect.objectContaining({
            bucket: 'documents',
            objectKey: 'user-documents/new.pdf',
            checksumSha256: 'deadbeef'
        }), { client: expect.any(Object) });
        expect(mocks.sideEffectOutboxService.enqueueRoleNotification).toHaveBeenCalledWith(
            expect.objectContaining({
                type: 'document.uploaded',
                organizationId: 'org-1',
                data: expect.objectContaining({
                    userId: 'user-1',
                    documentId: 'doc-1',
                    userDocumentId: 'ud-1'
                })
            }),
            expect.objectContaining({
                client: expect.any(Object),
                idempotencyKey: 'document.uploaded.user_document.user-1.doc-1.user-documents/new.pdf'
            })
        );
        expect(mocks.sideEffectOutboxService.enqueueFileGcDelete).toHaveBeenCalledWith(
            expect.objectContaining({
                fileId: 'file-old'
            }),
            expect.objectContaining({
                client: expect.any(Object)
            })
        );
    });

    it('storeUserDocument rolls back and queues uploaded file cleanup when outbox enqueue fails', async () => {
        const mocks = buildMocks();
        mocks.onboardingDocumentsRepository.upsertUserDocument.mockResolvedValue({
            document: { id: 'ud-1' },
            oldFileId: null
        });
        mocks.onboardingDocumentsRepository.getUserOrganization.mockResolvedValue('org-1');
        mocks.sideEffectOutboxService.enqueueRoleNotification.mockRejectedValue(new Error('outbox down'));

        const service = createOnboardingDocumentsService(mocks);

        await expect(service.storeUserDocument('user-1', 'doc-1', {
            filename: 'new.pdf',
            originalName: 'new.pdf',
            key: 'user-documents/new.pdf',
            bucket: 'documents',
            mimetype: 'application/pdf',
            size: 123
        })).rejects.toThrow('outbox down');

        expect(mocks.sideEffectOutboxService.enqueueFileGcDelete).toHaveBeenCalledWith(
            expect.objectContaining({
                bucket: 'documents',
                objectKey: 'user-documents/new.pdf'
            }),
            expect.any(Object)
        );
    });

    it('create requires hr or admin membership for organization-scoped templates', async () => {
        const mocks = buildMocks();
        mocks.onboardingDocumentsRepository.create.mockResolvedValue({ id: 'doc-1' });

        const service = createOnboardingDocumentsService(mocks);

        await service.create({
            organization_id: 'org-1',
            applies_to_all_organizations: false,
            name: 'Template'
        }, {
            actorUserId: 'actor-1'
        });

        expect(mocks.membershipAccessPort.ensureMembershipCreateAccess).toHaveBeenCalledWith({
            actorUserId: 'actor-1',
            organizationId: 'org-1',
            allowedRoles: ['hr', 'admin']
        });
    });

    it('create requires admin membership for all-organization templates', async () => {
        const mocks = buildMocks();
        mocks.onboardingDocumentsRepository.create.mockResolvedValue({ id: 'doc-2' });

        const service = createOnboardingDocumentsService(mocks);

        await service.create({
            organization_id: 'org-1',
            applies_to_all_organizations: true,
            name: 'Global Template'
        }, {
            actorUserId: 'actor-1'
        });

        expect(mocks.membershipAccessPort.ensureMembershipCreateAccess).toHaveBeenCalledWith({
            actorUserId: 'actor-1',
            organizationId: 'org-1',
            allowedRoles: ['admin']
        });
    });
});
