const createJobsApplication = require('../../src/core/jobs/application');
const { createMockLogger } = require('../helpers');

const createDependencies = () => {
    const client = {};

    const jobsStorePort = {
        withTransaction: jest.fn(async (callback) => callback(client)),
        getJobById: jest.fn().mockResolvedValue({ id: 'job-1', organization_id: 'org-job' }),
        getJobs: jest.fn().mockResolvedValue([]),
        getJobsAdmin: jest.fn().mockResolvedValue({ data: [], pagination: {} }),
        getJobDetail: jest.fn().mockResolvedValue({
            id: 'job-public-1',
            organization_id: 'org-job',
            contact_photo_file_id: 'file-1',
            _contact_photo_bucket: 'public-organization-photos',
            _contact_photo_object_key: 'organization-contact-photos/org-job/photo.png',
            sections: {}
        }),
        getJobDetailAdmin: jest.fn().mockResolvedValue({
            id: 'job-1',
            organization_id: 'org-job',
            title: 'Job detail',
            status: 'draft',
            sections: {}
        }),
        saveJob: jest.fn().mockImplementation(async (_id, payload, options = {}) => {
            const job = { id: 'job-1', organization_id: payload.organization_id || 'org-job', ...payload };
            if (typeof options.onBeforeCommit === 'function') {
                await options.onBeforeCommit({ client, job });
            }
            return job;
        }),
        deleteJob: jest.fn().mockResolvedValue({ id: 'job-1' }),
        ensureAuthorizedPersonMembership: jest.fn().mockResolvedValue({
            id: 'membership-1', user_id: 'user-1', organization_id: 'org-job',
            needsMembershipSync: false, needsRoleSync: false
        })
    };

    return {
        client,
        jobsStorePort,
        jobEmbeddingsStorePort: {
            getByJobId: jest.fn().mockResolvedValue(null),
            getByJobIdWithEmbedding: jest.fn().mockResolvedValue(null),
            getValidCachedEmbedding: jest.fn().mockResolvedValue(null),
            createOrUpdatePending: jest.fn().mockResolvedValue({}),
            updateStatusProcessing: jest.fn(),
            saveCompletedResult: jest.fn(),
            saveFailedResult: jest.fn(),
            deleteByJobId: jest.fn(),
            generateContentHash: jest.fn().mockReturnValue('hash-1')
        },
        jobsAuditPort: {
            recordJobCreated: jest.fn(),
            recordJobUpdated: jest.fn(),
            recordJobDeleted: jest.fn(),
            recordJobDuplicated: jest.fn()
        },
        jobsOutboxPort: {
            enqueueJobSync: jest.fn().mockResolvedValue({ id: 'outbox-1' }),
            enqueueUserRoleSync: jest.fn().mockResolvedValue({ id: 'outbox-2' }),
            enqueueMembershipSync: jest.fn().mockResolvedValue({ id: 'outbox-3' }),
            enqueueJobEmbeddingRequest: jest.fn().mockResolvedValue({ id: 'outbox-4' })
        },
        membershipAccessPort: {
            ensureMembershipCreateAccess: jest.fn().mockResolvedValue({ granted: true })
        },
        sectionItemsStorePort: {
            ensureCatalogItems: jest.fn().mockResolvedValue([])
        },
        jobPermissionPort: {
            syncJobPostingPermissions: jest.fn().mockResolvedValue({ jobPostingId: 'job-1' }),
            replaceDirectJobAssignments: jest.fn().mockResolvedValue([]),
            getDirectJobAssignments: jest.fn().mockResolvedValue([])
        },
        internalUserProvisioningPort: {
            ensureLocalUser: jest.fn().mockResolvedValue({ user: { id: 'user-1' }, organization: { id: 'org-other' }, created: true })
        },
        jobSeekerCvAnalysisQueryPort: { findMatchingJobSeekers: jest.fn() },
        logger: createMockLogger()
    };
};

describe('jobs application', () => {
    const originalBaseUrl = process.env.PUBLIC_S3_BASE_URL;

    beforeEach(() => {
        process.env.PUBLIC_S3_BASE_URL = 'https://cdn.example.com';
    });

    afterAll(() => {
        if (originalBaseUrl === undefined) {
            delete process.env.PUBLIC_S3_BASE_URL;
            return;
        }
        process.env.PUBLIC_S3_BASE_URL = originalBaseUrl;
    });

    it('enriches public job detail with contact_photo_url', async () => {
        const deps = createDependencies();
        const application = createJobsApplication(deps);

        const result = await application.getJobDetail('job-public-1');

        expect(deps.jobsStorePort.getJobDetail).toHaveBeenCalledWith('job-public-1');
        expect(result).toEqual({
            id: 'job-public-1',
            organization_id: 'org-job',
            contact_photo_file_id: 'file-1',
            contact_photo_url: 'https://cdn.example.com/public-organization-photos/organization-contact-photos/org-job/photo.png',
            sections: {}
        });
    });

    it('enriches admin job detail with authorized people from rebac port', async () => {
        const deps = createDependencies();
        deps.jobsStorePort.getJobDetailAdmin.mockResolvedValue({
            id: 'job-1',
            organization_id: 'org-job',
            title: 'Detail',
            sections: { duties: ['Test'] }
        });
        deps.jobPermissionPort.getDirectJobAssignments.mockResolvedValue([
            { userId: 'user-1', fullName: 'Jana Novakova' }
        ]);
        const application = createJobsApplication(deps);

        const result = await application.getJobDetailAdmin('job-1', {
            actorUserId: 'actor-1',
            minAccess: 'read'
        });

        expect(deps.jobsStorePort.getJobDetailAdmin).toHaveBeenCalledWith('job-1', {
            actorUserId: 'actor-1',
            minAccess: 'read'
        });
        expect(deps.jobPermissionPort.getDirectJobAssignments).toHaveBeenCalledWith('job-1');
        expect(result).toEqual({
            id: 'job-1',
            organization_id: 'org-job',
            title: 'Detail',
            sections: { duties: ['Test'] },
            authorized_people: [{ userId: 'user-1', fullName: 'Jana Novakova' }]
        });
    });

    it('materializes job permissions and enqueues sync before commit when creating a job', async () => {
        const deps = createDependencies();
        const application = createJobsApplication(deps);

        await application.createJob({
            title: 'Novy inzerat',
            organization_id: 'org-job',
            status: 'draft'
        }, { id: 'actor-1' });

        expect(deps.membershipAccessPort.ensureMembershipCreateAccess).toHaveBeenCalledWith({
            actorUserId: 'actor-1',
            organizationId: 'org-job',
            allowedRoles: ['hr', 'admin']
        });
        expect(deps.sectionItemsStorePort.ensureCatalogItems).not.toHaveBeenCalled();
        expect(deps.jobPermissionPort.syncJobPostingPermissions).toHaveBeenCalledWith('job-1', {
            client: deps.client
        });
        expect(deps.jobsOutboxPort.enqueueJobSync).toHaveBeenCalledWith({
            client: deps.client,
            jobId: 'job-1',
            organizationId: 'org-job'
        });
        expect(deps.jobsAuditPort.recordJobCreated).toHaveBeenCalled();
    });

    it('syncs section catalog items in the same transaction when creating a job', async () => {
        const deps = createDependencies();
        const application = createJobsApplication(deps);

        await application.createJob({
            title: 'Novy inzerat',
            organization_id: 'org-job',
            status: 'draft',
            sections: {
                duties: [' Poskytování péče ', 'Komunikace s pacienty'],
                requirements: ['Empatie'],
                benefits: ['5 týdnů dovolené']
            }
        }, { id: 'actor-1' });

        expect(deps.sectionItemsStorePort.ensureCatalogItems).toHaveBeenNthCalledWith(
            1, 'duties', [' Poskytování péče ', 'Komunikace s pacienty'], { client: deps.client }
        );
        expect(deps.sectionItemsStorePort.ensureCatalogItems).toHaveBeenNthCalledWith(
            2, 'requirements', ['Empatie'], { client: deps.client }
        );
        expect(deps.sectionItemsStorePort.ensureCatalogItems).toHaveBeenNthCalledWith(
            3, 'benefits', ['5 týdnů dovolené'], { client: deps.client }
        );
    });

    it('syncs only submitted sections when updating a job', async () => {
        const deps = createDependencies();
        const application = createJobsApplication(deps);

        await application.updateJob('job-1', {
            title: 'Aktualizovana pozice',
            sections: { duties: ['Nová povinnost'] }
        }, 'actor-1');

        expect(deps.jobsStorePort.getJobDetailAdmin).toHaveBeenCalledWith('job-1', {
            actorUserId: 'actor-1',
            minAccess: 'write'
        });
        expect(deps.sectionItemsStorePort.ensureCatalogItems).toHaveBeenCalledTimes(1);
        expect(deps.sectionItemsStorePort.ensureCatalogItems).toHaveBeenCalledWith(
            'duties', ['Nová povinnost'], { client: deps.client }
        );
        expect(deps.jobPermissionPort.syncJobPostingPermissions).toHaveBeenCalledWith('job-1', {
            client: deps.client
        });
    });

    it('allows assigning authorized person and enqueues membership sync', async () => {
        const deps = createDependencies();
        deps.jobsStorePort.ensureAuthorizedPersonMembership.mockResolvedValue({
            id: 'membership-1', user_id: 'user-1', organization_id: 'org-job',
            needsMembershipSync: true, needsRoleSync: true
        });
        const application = createJobsApplication(deps);

        await application.updateAuthorizedPeople('job-1', [
            { email: 'jana.novakova@kzcr.eu', seatLocation: 'UL', name: 'Jana', surname: 'Novakova' }
        ], 'actor-1');

        expect(deps.internalUserProvisioningPort.ensureLocalUser).toHaveBeenCalledWith(
            expect.objectContaining({ email: 'jana.novakova@kzcr.eu' }),
            { client: deps.client }
        );
        expect(deps.jobsStorePort.ensureAuthorizedPersonMembership).toHaveBeenCalledWith({
            client: deps.client,
            userId: 'user-1',
            organizationId: 'org-job',
            assignedBy: 'actor-1'
        });
        expect(deps.jobsOutboxPort.enqueueUserRoleSync).toHaveBeenCalledWith({
            client: deps.client,
            user: { id: 'user-1', organization_id: 'org-job' }
        });
        expect(deps.jobsOutboxPort.enqueueMembershipSync).toHaveBeenCalledWith({
            client: deps.client,
            assignment: expect.objectContaining({ id: 'membership-1' })
        });
        expect(deps.jobPermissionPort.replaceDirectJobAssignments).toHaveBeenCalledWith(
            'job-1', ['user-1'], { client: deps.client }
        );
    });

    it('rejects assignment when seatLocation cannot be mapped to organization', async () => {
        const deps = createDependencies();
        deps.internalUserProvisioningPort.ensureLocalUser.mockRejectedValue({
            status: 422,
            message: 'SeatLocation "XX" nema mapovani na organizaci'
        });
        const application = createJobsApplication(deps);

        await expect(application.updateAuthorizedPeople('job-1', [
            { email: 'jana.novakova@kzcr.eu', seatLocation: 'XX' }
        ], 'actor-1')).rejects.toMatchObject({
            status: 422,
            message: 'SeatLocation "XX" nema mapovani na organizaci'
        });
    });

    it('does not enqueue sync when membership is unchanged', async () => {
        const deps = createDependencies();
        deps.jobsStorePort.ensureAuthorizedPersonMembership.mockResolvedValue({
            id: 'membership-1', user_id: 'user-1', organization_id: 'org-job',
            needsMembershipSync: false, needsRoleSync: false
        });
        const application = createJobsApplication(deps);

        await application.updateAuthorizedPeople('job-1', [
            { email: 'jana.novakova@kzcr.eu', seatLocation: 'UL' }
        ], 'actor-1');

        expect(deps.jobsOutboxPort.enqueueMembershipSync).not.toHaveBeenCalled();
        expect(deps.jobsOutboxPort.enqueueUserRoleSync).not.toHaveBeenCalled();
    });

    it('removes direct job assignments when authorized people list becomes empty', async () => {
        const deps = createDependencies();
        const application = createJobsApplication(deps);

        await application.updateAuthorizedPeople('job-1', [], 'actor-1');

        expect(deps.internalUserProvisioningPort.ensureLocalUser).not.toHaveBeenCalled();
        expect(deps.jobPermissionPort.replaceDirectJobAssignments).toHaveBeenCalledWith(
            'job-1', [], { client: deps.client }
        );
        expect(deps.jobPermissionPort.getDirectJobAssignments).toHaveBeenCalledWith(
            'job-1', { client: deps.client }
        );
    });
});
