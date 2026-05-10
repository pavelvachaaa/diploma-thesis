const nodemailer = require('nodemailer');

const PERMANENT_TRANSPORT_CODES = new Set([
    'EENVELOPE'
]);

const TRANSIENT_TRANSPORT_CODES = new Set([
    'ECONNECTION',
    'ETIMEDOUT',
    'ESOCKET',
    'EPROTOCOL',
    'EDNS'
]);

/**
 * Email utility for sending transactional emails
 * Uses SMTP configuration from environment variables
 */
class MailerService {
    constructor({ logger, audit }) {
        this.logger = logger;
        this.audit = audit;
        this.transporter = null;
        this.initialized = false;
    }

    createEmailError(message, { code = 'EMAIL_SEND_ERROR', isPermanent = false, details = null } = {}) {
        const error = new Error(message);
        error.code = code;
        error.isPermanent = isPermanent;
        if (details) {
            error.details = details;
        }
        return error;
    }

    normalizeSmtpRecipients(recipients = []) {
        return (recipients || [])
            .map((recipient) => {
                if (typeof recipient === 'string') {
                    return recipient.trim();
                }

                if (recipient && typeof recipient.address === 'string') {
                    return recipient.address.trim();
                }

                return String(recipient || '').trim();
            })
            .filter(Boolean);
    }

    assertSmtpSendOutcome(info, to) {
        const accepted = this.normalizeSmtpRecipients(info?.accepted);
        const rejected = this.normalizeSmtpRecipients(info?.rejected);

        if (rejected.length > 0) {
            throw this.createEmailError('SMTP rejected one or more recipients', {
                code: 'EMAIL_SMTP_RECIPIENTS_REJECTED',
                isPermanent: true,
                details: {
                    to,
                    accepted,
                    rejected,
                    response: info?.response || null
                }
            });
        }

        if (accepted.length === 0) {
            throw this.createEmailError('SMTP accepted no recipients', {
                code: 'EMAIL_SMTP_NO_ACCEPTED_RECIPIENTS',
                isPermanent: true,
                details: {
                    to,
                    response: info?.response || null
                }
            });
        }
    }

    classifyTransportError(error) {
        if (!error || typeof error !== 'object') {
            return error;
        }

        if (typeof error.isPermanent === 'boolean') {
            return error;
        }

        const code = String(error.code || '').toUpperCase();
        const responseCode = Number(error.responseCode);
        if (Number.isFinite(responseCode)) {
            // 5xx SMTP responses are permanent, 4xx are transient.
            if (responseCode >= 500 && responseCode < 600) {
                error.isPermanent = true;
                return error;
            }

            if (responseCode >= 400 && responseCode < 500) {
                error.isPermanent = false;
                return error;
            }
        }

        if (PERMANENT_TRANSPORT_CODES.has(code)) {
            error.isPermanent = true;
            return error;
        }

        if (TRANSIENT_TRANSPORT_CODES.has(code)) {
            error.isPermanent = false;
            return error;
        }

        error.isPermanent = false;
        return error;
    }

    /**
     * Initialize the mailer with SMTP configuration
     */
    async initialize() {
        if (this.initialized) {
            return;
        }

        const config = {
            host: process.env.EMAIL_HOST,
            port: parseInt(process.env.EMAIL_PORT) || 587,
            secure: process.env.EMAIL_SECURE === 'true',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD
            },
            tls: {
                rejectUnauthorized: false
            },
            pool: true,
            maxConnections: 5,
            maxMessages: 100
        };

        if (!config.host || !config.auth.user || !config.auth.pass) {
            throw new Error('Email configuration missing. Required: EMAIL_HOST, EMAIL_USER, EMAIL_PASSWORD');
        }

        try {
            this.transporter = nodemailer.createTransport(config);
            await this.transporter.verify();
            this.initialized = true;

            this.logger.info('Mailer service initialized successfully');
        } catch (error) {
            this.logger.error('Failed to initialize mailer service', { error: error.message });
            throw error;
        }
    }

    /**
     * Send an email 
     * @param {Object} emailOptions - Email options
     * @param {string} emailOptions.to - Recipient email address
     * @param {string} emailOptions.subject - Email subject
     * @param {string} emailOptions.text - Plain text content
     * @param {string} emailOptions.html - HTML content
     * @param {Array} emailOptions.attachments - Array of attachment objects
     */
    async sendEmail({ to, subject, text, html, attachments = [], icalEvent = null, audit = {} }) {
        if (!to || !subject) {
            throw new Error('Missing required email fields: to, subject');
        }

        const mailOptions = {
            from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
            to,
            subject,
            text,
            html,
            attachments,
            icalEvent: icalEvent
        };

        try {
            if (!this.initialized) {
                await this.initialize();
            }

            const info = await this.transporter.sendMail(mailOptions);
            this.assertSmtpSendOutcome(info, to);

            this.logger.info('Email sent successfully', {
                messageId: info.messageId,
                to,
                hasAttachments: attachments.length > 0
            });

            await this.audit.writeAuditEvent({
                category: 'email',
                action: audit.action || 'email.send',
                status: 'success',
                source: audit.source || 'api',
                organizationId: audit.organizationId || null,
                resourceType: audit.resourceType || null,
                resourceId: audit.resourceId || null,
                target: Array.isArray(to) ? to.join(',') : to,
                metadata: {
                    subject,
                    messageId: info.messageId,
                    hasAttachments: attachments.length > 0,
                    hasICalendar: !!icalEvent,
                    ...audit.metadata
                }
            });

            return {
                success: true,
                messageId: info.messageId,
                accepted: info.accepted,
                rejected: info.rejected
            };
        } catch (error) {
            const classifiedError = this.classifyTransportError(error);
            this.logger.error('Failed to send email', {
                error: classifiedError.message,
                errorCode: classifiedError.code || null,
                isPermanent: classifiedError.isPermanent === true,
                to,
                subject
            });

            await this.audit.writeAuditEvent({
                category: 'email',
                action: audit.action || 'email.send',
                status: 'failure',
                source: audit.source || 'api',
                organizationId: audit.organizationId || null,
                resourceType: audit.resourceType || null,
                resourceId: audit.resourceId || null,
                target: Array.isArray(to) ? to.join(',') : to,
                errorMessage: classifiedError.message,
                metadata: {
                    subject,
                    hasAttachments: attachments.length > 0,
                    hasICalendar: !!icalEvent,
                    ...audit.metadata
                }
            });
            throw classifiedError;
        }
    }

    /**
     * Send welcome email with template
     * @param {Object} options - Welcome email options
     * @param {string} options.to - Recipient email
     * @param {string} options.employeeName - Employee name
     * @param {string} options.username - Login username
     * @param {string} options.password - Login password
     * @param {string} options.loginUrl - Login URL
     * @param {string} options.organizationName - Organization name
     * @param {Object} options.audit - Optional audit metadata overrides
     * @returns {Object} - Send result
     */
    async sendWelcomeEmail({ to, employeeName, username, password, loginUrl, organizationName, audit = {} }) {
        const welcomeTemplate = require('@shared/emailTemplates/welcomeTemplate');

        const { html, text } = welcomeTemplate.generate({
            employeeName,
            username,
            password,
            loginUrl,
            organizationName
        });

        return await this.sendEmail({
            to,
            subject: `Vítejte v ${organizationName || 'KZCR'} - Přihlašovací údaje`,
            text,
            html,
            audit: {
                action: 'email.welcome',
                ...audit
            }
        });
    }

    /**
     * Send test email
     * @param {string} testEmail - Test recipient email
     * @returns {Object} - Send result
     */
    async sendTestEmail(testEmail) {
        const testSubject = 'Test Email - KZCR System';
        const testText = 'Toto je testovací email z KZCR systému. Pokud jste tento email obdrželi, email služba funguje správně.';
        const testHtml = `
            <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px;">
                <h2 style="color: #2563eb;">Test Email - KZCR System</h2>
                <p>Toto je testovací email z KZCR systému.</p>
                <p>Pokud jste tento email obdrželi, email služba funguje správně.</p>
                <hr style="margin: 20px 0; border: none; border-top: 1px solid #e5e7eb;">
                <p style="font-size: 12px; color: #6b7280;">
                    Odesláno z KZCR hiring systému v ${new Date().toLocaleString('cs-CZ')}
                </p>
            </div>
        `;

        return await this.sendEmail({
            to: testEmail,
            subject: testSubject,
            text: testText,
            html: testHtml
        });
    }

    async sendApplicationReceivedEmail({ to, applicantName, jobTitle, organizationName }) {
        const applicationReceivedTemplate = require('@shared/emailTemplates/applicationReceivedTemplate');

        const { html, text } = applicationReceivedTemplate.generate({
            applicantName,
            jobTitle,
            organizationName
        });

        return await this.sendEmail({
            to,
            subject: `Potvrzení o přijetí přihlášky - ${organizationName || 'KZCR'}`,
            text,
            html
        });
    }

    async sendApplicationUnderReviewEmail({ to, applicantName, jobTitle, organizationName }) {
        const applicationUnderReviewTemplate = require('@shared/emailTemplates/applicationUnderReviewTemplate');

        const { html, text } = applicationUnderReviewTemplate.generate({
            applicantName,
            jobTitle,
            organizationName
        });

        return await this.sendEmail({
            to,
            subject: `Vaše přihláška se posuzuje - ${organizationName || 'KZCR'}`,
            text,
            html
        });
    }

    async sendRejectionEmail({ to, applicantName, jobTitle, organizationName, notes }) {
        const rejectionTemplate = require('@shared/emailTemplates/rejectionTemplate');

        const { html, text, subject } = rejectionTemplate.generate({
            applicantName,
            jobTitle,
            organizationName,
            notes
        });

        return await this.sendEmail({
            to,
            subject,
            text,
            html
        });
    }
}

module.exports = ({ logger, audit }) => {
    return new MailerService({ logger, audit });
};
