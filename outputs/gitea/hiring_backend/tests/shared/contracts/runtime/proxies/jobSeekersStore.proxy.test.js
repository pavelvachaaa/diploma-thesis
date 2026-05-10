const createProxy = require('../../../../../src/shared/contracts/runtime/proxies/jobSeekers/jobSeekersStore.proxy');

describe('JobSeekersStorePort runtime proxy', () => {
    const createAdapter = () => ({
        withTransaction: jest.fn(async (work) => work({ query: jest.fn() })),
        createJobSeeker: jest.fn().mockResolvedValue({ id: 'seeker-1' }),
        createJobSeekerLocations: jest.fn().mockResolvedValue([{ job_seeker_id: 'seeker-1', organization_id: 'org-1' }]),
        createJobSeekerAttachments: jest.fn().mockResolvedValue([{ job_seeker_id: 'seeker-1', file_id: 'file-1' }]),
        getAllJobSeekers: jest.fn().mockResolvedValue({ data: [], pagination: {} }),
        getJobSeekerById: jest.fn().mockResolvedValue({ id: 'seeker-1' }),
        getDeleteMetadata: jest.fn().mockResolvedValue({ id: 'seeker-1' }),
        deleteJobSeeker: jest.fn().mockResolvedValue({ id: 'seeker-1' }),
        getJobSeekersByOrganization: jest.fn().mockResolvedValue([{ id: 'seeker-1' }]),
        getAttachmentsByJobSeekerId: jest.fn().mockResolvedValue([{ id: 'att-1' }]),
        getAttachmentById: jest.fn().mockResolvedValue({ id: 'att-1' })
    });

    it('delegates store operations through the strict port', async () => {
        const jobSeekersStoreAdapter = createAdapter();
        const port = createProxy({ jobSeekersStoreAdapter });
        const options = { client: { query: jest.fn() }, actorUserId: 'user-1' };

        await port.withTransaction(async () => 'ok');
        await port.createJobSeeker({ first_name: 'Pavel' }, options);
        await port.createJobSeekerLocations('seeker-1', ['org-1'], options);
        await port.createJobSeekerAttachments('seeker-1', ['file-1'], options);
        await port.getAllJobSeekers({ page: '1', limit: '10' });
        await port.getJobSeekerById('seeker-1', options);
        await port.getDeleteMetadata('seeker-1', options);
        await port.deleteJobSeeker('seeker-1', options);
        await port.getJobSeekersByOrganization('org-1', options);
        await port.getAttachmentsByJobSeekerId('seeker-1', options);
        await port.getAttachmentById('seeker-1', 'att-1', options);

        expect(jobSeekersStoreAdapter.withTransaction).toHaveBeenCalledWith(expect.any(Function));
        expect(jobSeekersStoreAdapter.createJobSeeker).toHaveBeenCalledWith(
            { first_name: 'Pavel' },
            expect.objectContaining({ actorUserId: 'user-1' })
        );
        expect(jobSeekersStoreAdapter.createJobSeekerLocations).toHaveBeenCalledWith(
            'seeker-1',
            ['org-1'],
            expect.objectContaining({ actorUserId: 'user-1' })
        );
        expect(jobSeekersStoreAdapter.getAttachmentById).toHaveBeenCalledWith(
            'seeker-1',
            'att-1',
            expect.objectContaining({ actorUserId: 'user-1' })
        );
    });
});
