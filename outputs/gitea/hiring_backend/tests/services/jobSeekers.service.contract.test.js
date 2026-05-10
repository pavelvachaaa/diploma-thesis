const createJobSeekersService = require('../../src/core/jobSeekers/application');

describe('jobSeekers.service API contract', () => {
    it('exposes the same job seekers service API surface', () => {
        const service = createJobSeekersService({
            jobSeekersStorePort: {}
        });

        expect(Object.keys(service).sort()).toEqual([
            'createJobSeeker',
            'deleteJobSeeker',
            'getAllJobSeekers',
            'getAttachmentById',
            'getAttachmentsByJobSeekerId',
            'getJobSeekerById',
            'getJobSeekersByOrganization'
        ]);
    });
});
