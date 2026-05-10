const createApplicantCreation = require('../../src/domain/applicants/service/createApplicant');

describe('applicants createApplicant slice', () => {
    it('writes applicant, queues HR notification and received email, and emits audit', async () => {
        const applicant = {
            id: 'app-1',
            name: 'Jan',
            surname: 'Novak',
            organization_id: 'org-1',
            job_posting_id: 'job-1',
            current_status: 'submitted'
        };
        const client = { id: 'tx-client' };
        const runWriteWithOutbox = jest.fn(async ({ write, enqueue }) => {
            const writeResult = await write({ client });
            await enqueue({ client, writeResult });
            return { writeResult };
        });
        const queueApplicationReceivedEmail = jest.fn().mockResolvedValue();
        const queueRoleNotification = jest.fn().mockResolvedValue();
        const emitAudit = jest.fn();
        const slice = createApplicantCreation({
            applicantsRepository: {
                createApplicant: jest.fn().mockResolvedValue(applicant)
            },
            statusRepository: {
                createStatusHistory: jest.fn().mockResolvedValue({ id: 'history-1' })
            },
            jobsRepository: {
                getJobById: jest.fn().mockResolvedValue({ id: 'job-1', title: 'Nurse' })
            },
            runWriteWithOutbox,
            queueApplicationReceivedEmail,
            queueRoleNotification,
            emitAudit,
            createSnapshot: jest.fn((value) => value),
            APPLICANT_AUDIT_FIELDS: ['id', 'organization_id', 'job_posting_id']
        });

        const result = await slice.createApplicant({
            name: 'Jan',
            surname: 'Novak',
            job_posting_id: 'job-1',
            organization_id: 'org-1'
        });

        expect(result).toEqual(applicant);
        expect(runWriteWithOutbox).toHaveBeenCalled();
        expect(queueRoleNotification).toHaveBeenCalledWith(expect.objectContaining({
            aggregateId: 'app-1',
            organizationId: 'org-1'
        }));
        expect(queueApplicationReceivedEmail).toHaveBeenCalledWith(expect.objectContaining({
            applicant
        }));
        expect(emitAudit).toHaveBeenCalledWith(expect.objectContaining({
            action: 'applicant.create',
            resourceId: 'app-1'
        }));
    });
});
