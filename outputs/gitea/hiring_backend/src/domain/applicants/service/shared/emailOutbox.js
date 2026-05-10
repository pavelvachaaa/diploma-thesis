const applicationReceivedTemplate = require('@shared/emailTemplates/applicationReceivedTemplate');
const applicationUnderReviewTemplate = require('@shared/emailTemplates/applicationUnderReviewTemplate');
const rejectionTemplate = require('@shared/emailTemplates/rejectionTemplate');

module.exports = ({ sideEffectOutboxService }) => {
    const enqueueRawApplicantEmail = async ({
        client,
        applicant,
        job,
        subject,
        text,
        html,
        auditAction,
        metadata = {}
    }) => {
        return sideEffectOutboxService.enqueue({
            eventType: sideEffectOutboxService.EVENT_TYPES.RAW_EMAIL,
            aggregateType: 'applicant',
            aggregateId: applicant.id || null,
            organizationId: applicant.organization_id || job.organization_id || null,
            payload: {
                to: applicant.email,
                subject,
                text,
                html,
                attachments: [],
                icalEvent: null,
                audit: {
                    action: auditAction,
                    resourceType: 'applicant',
                    resourceId: applicant.id || null,
                    organizationId: applicant.organization_id || job.organization_id || null,
                    metadata
                }
            }
        }, {
            client
        });
    };

    const queueApplicationReceivedEmail = async ({ client, applicant, job }) => {
        if (!applicant || !job) {
            return null;
        }

        const applicantName = `${applicant.name} ${applicant.surname || ''}`.trim();
        const { html, text } = applicationReceivedTemplate.generate({
            applicantName,
            jobTitle: job.title,
            organizationName: job.organization_name
        });

        return enqueueRawApplicantEmail({
            client,
            applicant,
            job,
            subject: `Potvrzení o přijetí přihlášky - ${job.organization_name || 'KZCR'}`,
            text,
            html,
            auditAction: 'email.application.received',
            metadata: {
                jobId: job.id || null
            }
        });
    };

    const queueApplicationUnderReviewEmail = async ({ client, applicant, job }) => {
        if (!applicant || !job) {
            return null;
        }

        const applicantName = `${applicant.name} ${applicant.surname || ''}`.trim();
        const { html, text } = applicationUnderReviewTemplate.generate({
            applicantName,
            jobTitle: job.title,
            organizationName: job.organization_name
        });

        return enqueueRawApplicantEmail({
            client,
            applicant,
            job,
            subject: `Vaše přihláška se posuzuje - ${job.organization_name || 'KZCR'}`,
            text,
            html,
            auditAction: 'email.application.under_review',
            metadata: {
                jobId: job.id || null
            }
        });
    };

    const queueRejectionEmail = async ({ client, applicant, job, notes = null }) => {
        if (!applicant || !job) {
            return null;
        }

        const applicantName = `${applicant.name} ${applicant.surname || ''}`.trim();
        const { html, text, subject } = rejectionTemplate.generate({
            applicantName,
            jobTitle: job.title,
            organizationName: 'Krajská Zdravotní a.s.',
            notes
        });

        return enqueueRawApplicantEmail({
            client,
            applicant,
            job,
            subject,
            text,
            html,
            auditAction: 'email.application.rejection',
            metadata: {
                jobId: job.id || null
            }
        });
    };

    return {
        queueApplicationReceivedEmail,
        queueApplicationUnderReviewEmail,
        queueRejectionEmail
    };
};
