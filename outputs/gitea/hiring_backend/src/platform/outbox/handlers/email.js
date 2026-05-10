const {
    buildNormalizedTypeSet,
    createOutboxStrategy
} = require('./shared');

module.exports = ({ mailer, transformer, eventTypes }) => {
    const dispatchWelcomeEmail = async (event) => {
        const payload = event.payload || {};
        const password = transformer.decryptSecret(payload.encryptedPassword);

        const result = await mailer.sendWelcomeEmail({
            to: payload.to,
            employeeName: payload.employeeName,
            username: payload.username,
            password,
            loginUrl: payload.loginUrl,
            organizationName: payload.organizationName,
            audit: {
                source: 'outbox-worker',
                action: 'email.welcome',
                resourceType: 'employee',
                resourceId: event.aggregate_id || null,
                organizationId: event.organization_id || null,
                metadata: {
                    outboxId: event.id,
                    outboxEventType: event.event_type
                }
            }
        });

        return {
            providerMessageId: result.messageId || null
        };
    };

    const dispatchRawEmail = async (event) => {
        const payload = event.payload || {};
        const attachments = await transformer.materializeAttachmentsFromPayload(payload.attachments || []);
        const icalEvent = transformer.materializeIcalEventFromPayload(payload.icalEvent || null);
        const audit = payload.audit || {};

        const result = await mailer.sendEmail({
            to: payload.to,
            subject: payload.subject,
            text: payload.text,
            html: payload.html,
            attachments,
            icalEvent,
            audit: {
                ...audit,
                source: 'outbox-worker',
                metadata: {
                    ...(audit.metadata || {}),
                    outboxId: event.id,
                    outboxEventType: event.event_type
                }
            }
        });

        return {
            providerMessageId: result.messageId || null
        };
    };

    return [
        createOutboxStrategy({
            key: 'welcome',
            eventTypes: buildNormalizedTypeSet(eventTypes?.WELCOME_EMAIL, [
                'email.welcome.v1',
                'email.welcome'
            ]),
            prefixes: ['email.welcome'],
            dispatch: dispatchWelcomeEmail
        }),
        createOutboxStrategy({
            key: 'raw',
            eventTypes: buildNormalizedTypeSet(eventTypes?.RAW_EMAIL, [
                'email.raw.v1',
                'email.raw'
            ]),
            prefixes: ['email.raw'],
            dispatch: dispatchRawEmail
        })
    ];
};
