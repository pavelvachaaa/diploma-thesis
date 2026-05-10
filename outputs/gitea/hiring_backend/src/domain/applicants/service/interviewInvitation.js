module.exports = ({
    applicantsRepository,
    applicantEmailPort
}) => {
    const scheduleInterviewInvitation = async (applicantId, payload = {}) => {
        const {
            dateTime,
            location,
            locationType = 'office',
            participants = '',
            notes = ''
        } = payload;

        if (!dateTime || !location) {
            return {
                statusCode: 400,
                body: { message: 'Date/time and location are required' }
            };
        }

        const applicant = await applicantsRepository.getApplicantById(applicantId);
        if (!applicant) {
            return {
                statusCode: 404,
                body: { message: 'Applicant not found' }
            };
        }

        const applicantName = `${applicant.name} ${applicant.surname || ''}`.trim();

        const result = await applicantEmailPort.sendInterviewInvitation({
            applicantEmail: applicant.email,
            applicantName,
            dateTime,
            location,
            locationType,
            participants,
            notes,
            jobTitle: applicant.job_title || '',
            organizationName: applicant.organization_name || 'Krajská Zdravotní a.s.'
        });

        if (result?.success) {
            return {
                statusCode: 200,
                body: {
                    success: true,
                    message: 'Pozvánka na pohovor byla odeslána',
                    messageId: result.messageId,
                    sentTo: result.sentTo
                }
            };
        }

        return {
            statusCode: 500,
            body: {
                success: false,
                message: 'Nepodařilo se odeslat pozvánku na pohovor',
                error: result?.error
            }
        };
    };

    return {
        scheduleInterviewInvitation
    };
};
