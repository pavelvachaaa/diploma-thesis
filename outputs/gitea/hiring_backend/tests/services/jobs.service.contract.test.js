const createJobsApplication = require('../../src/core/jobs/application');
const { createMockLogger } = require('../helpers');

const createDependencies = () => ({
    jobsStorePort: {
        getJobs: jest.fn(), getJobsAdmin: jest.fn(), getJobById: jest.fn(),
        getJobDetail: jest.fn(), getJobDetailAdmin: jest.fn(),
        saveJob: jest.fn(), deleteJob: jest.fn(), withTransaction: jest.fn(),
        ensureAuthorizedPersonMembership: jest.fn()
    },
    jobEmbeddingsStorePort: {
        getByJobId: jest.fn(), getByJobIdWithEmbedding: jest.fn(),
        getValidCachedEmbedding: jest.fn(), createOrUpdatePending: jest.fn(),
        updateStatusProcessing: jest.fn(), saveCompletedResult: jest.fn(),
        saveFailedResult: jest.fn(), deleteByJobId: jest.fn(), generateContentHash: jest.fn()
    },
    jobsAuditPort: {
        recordJobCreated: jest.fn(), recordJobUpdated: jest.fn(),
        recordJobDeleted: jest.fn(), recordJobDuplicated: jest.fn()
    },
    jobsOutboxPort: {
        enqueueJobSync: jest.fn(), enqueueUserRoleSync: jest.fn(),
        enqueueMembershipSync: jest.fn(), enqueueJobEmbeddingRequest: jest.fn()
    },
    membershipAccessPort: { ensureMembershipCreateAccess: jest.fn() },
    sectionItemsStorePort: { ensureCatalogItems: jest.fn() },
    jobPermissionPort: {
        syncJobPostingPermissions: jest.fn(),
        replaceDirectJobAssignments: jest.fn(),
        getDirectJobAssignments: jest.fn()
    },
    internalUserProvisioningPort: { ensureLocalUser: jest.fn() },
    jobSeekerCvAnalysisQueryPort: { findMatchingJobSeekers: jest.fn() },
    logger: createMockLogger()
});

describe('jobs application API contract', () => {
    it('exposes expected jobs application API surface', () => {
        const application = createJobsApplication(createDependencies());

        expect(Object.keys(application).sort()).toEqual([
            'createJob',
            'deleteJob',
            'duplicateJob',
            'getJobById',
            'getJobDetail',
            'getJobDetailAdmin',
            'getJobEmbeddingStatus',
            'getJobs',
            'getJobsAdmin',
            'getMatchingJobSeekers',
            'getOrRequestEmbedding',
            'getStatus',
            'updateAuthorizedPeople',
            'updateJob'
        ]);
    });
});
