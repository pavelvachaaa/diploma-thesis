module.exports = ({
    applicantsRepository,
    applicantEmailPort
}) => {
    const sendEmailToApplicant = async (applicantId, payload = {}) => {
        const { message, senderUser = null, files = [] } = payload;

        if (!message || !message.trim()) {
            return {
                statusCode: 400,
                body: { message: 'Email message is required' }
            };
        }

        const applicant = await applicantsRepository.getApplicantById(applicantId);
        if (!applicant) {
            return {
                statusCode: 404,
                body: { message: 'Applicant not found' }
            };
        }

        const senderName = `${senderUser?.name || ''} ${senderUser?.surname || ''}`.trim() || 'KZCR Administration';
        const applicantName = `${applicant.name} ${applicant.surname || ''}`.trim();

        const attachments = (files || [])
            .filter((file) => file.key && file.bucket)
            .map((file) => ({
                filename: file.originalname,
                contentType: file.mimetype,
                storage: {
                    bucket: file.bucket,
                    key: file.key
                }
            }));

        const emailResult = await applicantEmailPort.sendApplicantEmail({
            applicantEmail: applicant.email,
            applicantName,
            message: message.trim(),
            senderName,
            attachments
        });

        if (!emailResult?.success) {
            return {
                statusCode: 500,
                body: {
                    success: false,
                    message: 'Nepodařilo se odeslat email uchazeči',
                    error: emailResult?.error || 'Unknown email dispatch error'
                }
            };
        }

        return {
            statusCode: 200,
            body: {
                success: true,
                message: 'Email byl úspěšně odeslán uchazeči'
            }
        };
    };

    return {
        sendEmailToApplicant
    };
};
