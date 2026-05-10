const createProxy = require('../../../../../src/shared/contracts/runtime/proxies/jobSeekers/jobSeekersFileGc.proxy');

describe('JobSeekersFileGcPort runtime proxy', () => {
    it('delegates file GC enqueue operations through the strict port', async () => {
        const jobSeekersFileGcAdapter = {
            enqueueDelete: jest.fn().mockResolvedValue({ id: 'outbox-1' })
        };
        const port = createProxy({ jobSeekersFileGcAdapter });

        await port.enqueueDelete({ bucket: 'cv-uploads', objectKey: 'job-seekers/cv.pdf' });

        expect(jobSeekersFileGcAdapter.enqueueDelete).toHaveBeenCalledWith(
            { bucket: 'cv-uploads', objectKey: 'job-seekers/cv.pdf' },
            {}
        );
    });
});
