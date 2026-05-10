const createApplicantEmailPort = require('../../../../src/shared/contracts/ports/applicantEmail.port');

describe('ApplicantEmailPort', () => {
    it('delegates to emailApplication methods', async () => {
        const emailApplication = {
            sendApplicantEmail: jest.fn().mockResolvedValue({ success: true }),
            sendInterviewInvitation: jest.fn().mockResolvedValue({ success: true })
        };

        const port = createApplicantEmailPort({ emailApplication });

        await port.sendApplicantEmail({ applicantEmail: 'jan@example.com' });
        await port.sendInterviewInvitation({ applicantEmail: 'jan@example.com' });

        expect(emailApplication.sendApplicantEmail).toHaveBeenCalledWith({ applicantEmail: 'jan@example.com' });
        expect(emailApplication.sendInterviewInvitation).toHaveBeenCalledWith({ applicantEmail: 'jan@example.com' });
    });

    it('fails fast when required email application methods are missing', () => {
        expect(() => createApplicantEmailPort({ emailApplication: {} })).toThrow([
            'Port dependency validation failed for ApplicantEmailPort:',
            ' - emailApplication.sendApplicantEmail must be a function',
            ' - emailApplication.sendInterviewInvitation must be a function'
        ].join('\n'));
    });
});
