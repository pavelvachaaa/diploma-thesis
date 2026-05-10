const createProxy = require('../../../../../src/shared/contracts/runtime/proxies/jobSeekers/jobSeekersFile.proxy');

describe('JobSeekersFilePort runtime proxy', () => {
    it('delegates file operations through the strict port', async () => {
        const jobSeekersFileAdapter = {
            createFileRecord: jest.fn().mockResolvedValue({ id: 'file-1', object_key: 'job-seekers/cv.pdf' }),
            markRetained: jest.fn().mockResolvedValue({ id: 'file-1', retention_until: '2026-03-10T00:00:00.000Z' })
        };
        const port = createProxy({ jobSeekersFileAdapter });
        const options = { client: { query: jest.fn() } };

        await port.createFileRecord({ bucket: 'cv-uploads', objectKey: 'job-seekers/cv.pdf' }, options);
        await port.markRetained('file-1', options);

        expect(jobSeekersFileAdapter.createFileRecord).toHaveBeenCalledWith(
            { bucket: 'cv-uploads', objectKey: 'job-seekers/cv.pdf' },
            { client: expect.any(Object) }
        );
        expect(jobSeekersFileAdapter.markRetained).toHaveBeenCalledWith('file-1', { client: expect.any(Object) });
    });
});
