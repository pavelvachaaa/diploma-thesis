const ApplicationError = require('@core/shared/errors/ApplicationError');
const { ErrorCode } = require('@core/shared/errors/ApplicationError');

const applicationReceivedTemplate = require('@shared/emailTemplates/applicationReceivedTemplate');
const applicationUnderReviewTemplate = require('@shared/emailTemplates/applicationUnderReviewTemplate');
const rejectionTemplate = require('@shared/emailTemplates/rejectionTemplate');

const VALID_STATUSES = Object.freeze(['received', 'under_review', 'rejected']);

module.exports = ({ emailOutboxPort, logger }) => {
    return async ({ status, applicant, job, notes }) => {
        if (!VALID_STATUSES.includes(status)) {
            throw new ApplicationError(`status must be one of: ${VALID_STATUSES.join(', ')}`, { code: ErrorCode.VALIDATION_ERROR });
        }
        if (!applicant || !job) {
            throw new ApplicationError('applicant and job are required', { code: ErrorCode.VALIDATION_ERROR });
        }

        const { email, name, surname, id: applicantId, organization_id } = applicant;
        const applicantName = `${name} ${surname || ''}`.trim();

        let emailPayload;

        if (status === 'received') {
            const { html, text } = applicationReceivedTemplate.generate({
                applicantName,
                jobTitle: job.title,
                organizationName: job.organization_name
            });
            emailPayload = {
                to: email,
                subject: `Potvrzení o přijetí přihlášky - ${job.organization_name || 'KZCR'}`,
                text,
                html,
                audit: {
                    action: 'email.application.received',
                    resourceType: 'applicant',
                    resourceId: applicantId || null,
                    organizationId: organization_id || job.organization_id || null,
                    metadata: { jobId: job.id || null }
                }
            };
        } else if (status === 'under_review') {
            const { html, text } = applicationUnderReviewTemplate.generate({
                applicantName,
                jobTitle: job.title,
                organizationName: job.organization_name
            });
            emailPayload = {
                to: email,
                subject: `Vaše přihláška se posuzuje - ${job.organization_name || 'KZCR'}`,
                text,
                html,
                audit: {
                    action: 'email.application.under_review',
                    resourceType: 'applicant',
                    resourceId: applicantId || null,
                    organizationId: organization_id || job.organization_id || null,
                    metadata: { jobId: job.id || null }
                }
            };
        } else {
            const { html, text, subject } = rejectionTemplate.generate({
                applicantName,
                jobTitle: job.title,
                organizationName: 'Krajská Zdravotní a.s.',
                notes
            });
            emailPayload = {
                to: email,
                subject,
                text,
                html,
                audit: {
                    action: 'email.application.rejection',
                    resourceType: 'applicant',
                    resourceId: applicantId || null,
                    organizationId: organization_id || job.organization_id || null,
                    metadata: { jobId: job.id || null }
                }
            };
        }

        const outboxEvent = await emailOutboxPort.enqueueRawEmail(emailPayload, {
            aggregateType: 'applicant',
            aggregateId: applicantId || null,
            organizationId: organization_id || job.organization_id || null
        });

        logger?.info?.('Application status email queued', { status, applicantId, applicantEmail: email, jobId: job.id });

        return {
            success: true,
            queued: true,
            sent: false,
            outboxId: outboxEvent?.id || null,
            messageId: null
        };
    };
};
