const createOnboardingDocumentsService = require('../../src/domain/onboardingDocuments/service');
const { createMockLogger } = require('../helpers');

const createDependencies = () => ({
    onboardingDocumentsRepository: {
        withTransaction: jest.fn()
    },
    sideEffectOutboxService: {
        enqueueRoleNotification: jest.fn()
    },
    membershipAccessPort: {},
    fileGateway: {},
    logger: createMockLogger()
});

describe('onboardingDocuments.service API contract', () => {
    it('exposes expected onboarding documents service API surface', () => {
        const service = createOnboardingDocumentsService(createDependencies());

        expect(Object.keys(service).sort()).toEqual([
            'assignToJobRole',
            'attachDocumentToStep',
            'attachDocumentToWorkflow',
            'create',
            'delete',
            'deleteUserDocument',
            'getAll',
            'getById',
            'getByOrganization',
            'getDocumentsByJobRole',
            'getEmployeeDocumentForDownload',
            'getOnboardingTemplateByFilename',
            'getOnboardingTemplateForDownload',
            'getStepDocuments',
            'getUserDocumentById',
            'getUserDocumentForDownload',
            'getUserDocuments',
            'getWorkflowDocuments',
            'markDocumentAsRead',
            'removeDocumentFromStep',
            'removeDocumentFromWorkflow',
            'removeFromJobRole',
            'storeUserDocument',
            'update',
            'updateJobRoleAssignment',
            'updateUserDocumentStatus',
            'updateWorkflowDocumentAttachment'
        ]);
    });
});
