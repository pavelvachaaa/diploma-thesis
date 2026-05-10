const createApplicantEmail = require('../../src/domain/applicants/service/applicantEmail');
const createInterviewInvitation = require('../../src/domain/applicants/service/interviewInvitation');

describe('applicants communication leaves', () => {
    it('sends applicant email through applicantEmailPort', async () => {
        const leaf = createApplicantEmail({
            applicantsRepository: {
                getApplicantById: jest.fn().mockResolvedValue({ name: 'Jan', surname: 'Novak', email: 'jan@example.com' })
            },
            applicantEmailPort: {
                sendApplicantEmail: jest.fn().mockResolvedValue({ success: true })
            }
        });

        const result = await leaf.sendEmailToApplicant('applicant-1', {
            message: 'Ahoj'
        });

        expect(result.statusCode).toBe(200);
    });

    it('sends interview invitation through applicantEmailPort', async () => {
        const leaf = createInterviewInvitation({
            applicantsRepository: {
                getApplicantById: jest.fn().mockResolvedValue({
                    name: 'Jan',
                    surname: 'Novak',
                    email: 'jan@example.com',
                    job_title: 'Nurse',
                    organization_name: 'KZ'
                })
            },
            applicantEmailPort: {
                sendInterviewInvitation: jest.fn().mockResolvedValue({ success: true, sentTo: 'jan@example.com' })
            }
        });

        const result = await leaf.scheduleInterviewInvitation('applicant-1', {
            dateTime: '2026-03-24T10:00:00.000Z',
            location: 'Meeting room'
        });

        expect(result.statusCode).toBe(200);
    });
});
