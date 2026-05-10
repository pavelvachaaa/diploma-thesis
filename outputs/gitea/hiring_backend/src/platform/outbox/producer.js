module.exports = ({ sideEffectOutboxRepository, getRequestContext, config, transformer, eventTypes }) => {
    const normalizeEventType = (value) => String(value || '')
        .replace(/[\u0000-\u001f]/g, '')
        .replace(/^["'`]+|["'`]+$/g, '')
        .trim();

    const enqueue = async (
        {
            eventType,
            payload = {},
            aggregateType = null,
            aggregateId = null,
            organizationId = null,
            requestId = null,
            maxAttempts = config.getMaxAttempts()
        },
        {
            client = null,
            idempotencyKey = null,
            availableAt = null
        } = {}
    ) => {
        const context = getRequestContext();
        const normalizedEventType = normalizeEventType(eventType);

        if (!normalizedEventType) {
            throw new Error('eventType is required for side effect outbox enqueue');
        }

        return sideEffectOutboxRepository.enqueue({
            eventType: normalizedEventType,
            idempotencyKey,
            aggregateType,
            aggregateId,
            organizationId,
            requestId: requestId || context.requestId || null,
            maxAttempts,
            availableAt,
            payload: payload || {}
        }, { client });
    };

    const enqueueWelcomeEmail = async (
        { employee, plainPassword, loginUrl = null },
        { client = null, idempotencyKey = null } = {}
    ) => {
        if (!employee || !employee.id || !employee.email || !employee.name) {
            throw new Error('Valid employee payload is required for welcome email outbox enqueue');
        }

        if (!plainPassword) {
            throw new Error('plainPassword is required for welcome email outbox enqueue');
        }

        const employeeName = `${employee.name} ${employee.surname || ''}`.trim();
        const defaultLoginUrl = process.env.FRONTEND_URL
            ? `${process.env.FRONTEND_URL}/login`
            : 'https://onboarding.kzcr.eu/login';

        return enqueue({
            eventType: eventTypes.WELCOME_EMAIL,
            aggregateType: 'employee',
            aggregateId: employee.id,
            organizationId: employee.organization_id || null,
            payload: {
                to: employee.email,
                employeeName,
                username: employee.email,
                loginUrl: loginUrl || defaultLoginUrl,
                organizationName: employee.organization_name || 'Krajská Zdravotní a.s.',
                encryptedPassword: transformer.encryptSecret(plainPassword)
            }
        }, {
            client,
            idempotencyKey: idempotencyKey || `email.welcome.employee.${employee.id}`
        });
    };

    const enqueueRawEmail = async (
        {
            to,
            subject,
            text = '',
            html = '',
            attachments = [],
            icalEvent = null,
            audit = {}
        },
        {
            client = null,
            idempotencyKey = null,
            aggregateType = null,
            aggregateId = null,
            organizationId = null,
            requestId = null,
            maxAttempts = config.getMaxAttempts(),
            availableAt = null
        } = {}
    ) => {
        if (!to || !subject) {
            throw new Error('to and subject are required for raw email outbox enqueue');
        }

        return enqueue({
            eventType: eventTypes.RAW_EMAIL,
            aggregateType,
            aggregateId,
            organizationId,
            requestId,
            maxAttempts,
            payload: {
                to,
                subject,
                text,
                html,
                attachments: transformer.normalizeAttachmentsForPayload(attachments),
                icalEvent: transformer.normalizeIcalEventForPayload(icalEvent),
                audit: audit || {}
            }
        }, {
            client,
            idempotencyKey,
            availableAt
        });
    };

    const enqueueRoleNotification = async (
        {
            type,
            organizationId,
            title,
            body = null,
            data = {},
            actionUrl = null,
            roleName = 'HR'
        },
        {
            client = null,
            idempotencyKey = null,
            aggregateType = null,
            aggregateId = null,
            requestId = null,
            maxAttempts = config.getMaxAttempts(),
            availableAt = null
        } = {}
    ) => {
        if (!type || !organizationId || !title) {
            throw new Error('type, organizationId, and title are required for role notification outbox enqueue');
        }

        return enqueue({
            eventType: eventTypes.ROLE_NOTIFICATION,
            aggregateType,
            aggregateId,
            organizationId,
            requestId,
            maxAttempts,
            payload: {
                type,
                organizationId,
                title,
                body,
                data,
                actionUrl,
                roleName
            }
        }, {
            client,
            idempotencyKey,
            availableAt
        });
    };

    const enqueueUserNotification = async (
        {
            userId,
            type,
            title,
            body = null,
            data = {},
            actionUrl = null,
            skipPreferences = false
        },
        {
            client = null,
            idempotencyKey = null,
            aggregateType = null,
            aggregateId = null,
            organizationId = null,
            requestId = null,
            maxAttempts = config.getMaxAttempts(),
            availableAt = null
        } = {}
    ) => {
        if (!userId || !type || !title) {
            throw new Error('userId, type, and title are required for user notification outbox enqueue');
        }

        return enqueue({
            eventType: eventTypes.USER_NOTIFICATION,
            aggregateType,
            aggregateId,
            organizationId,
            requestId,
            maxAttempts,
            payload: {
                userId,
                type,
                title,
                body,
                data,
                actionUrl,
                skipPreferences
            }
        }, {
            client,
            idempotencyKey,
            availableAt
        });
    };

    const enqueueFileGcDelete = async (
        {
            fileId = null,
            bucket = null,
            objectKey = null,
            organizationId = null,
            reason = 'retention_gc',
            sourceModule = 'files'
        },
        {
            client = null,
            idempotencyKey = null,
            aggregateType = 'file',
            aggregateId = null,
            requestId = null,
            maxAttempts = config.getMaxAttempts(),
            availableAt = null
        } = {}
    ) => {
        if (!fileId && !(bucket && objectKey)) {
            throw new Error('fileId or bucket+objectKey is required for file GC outbox enqueue');
        }

        const normalizedAggregateId = aggregateId || fileId || null;
        const dedupe = idempotencyKey
            || (fileId
                ? `file.gc.delete.${fileId}.${availableAt || 'immediate'}`
                : `file.gc.delete.object.${bucket}.${objectKey}`);

        return enqueue({
            eventType: eventTypes.FILE_GC_DELETE,
            aggregateType,
            aggregateId: normalizedAggregateId,
            organizationId,
            requestId,
            maxAttempts,
            payload: {
                fileId,
                bucket,
                objectKey,
                reason,
                sourceModule
            }
        }, {
            client,
            idempotencyKey: dedupe,
            availableAt
        });
    };

    return {
        enqueue,
        enqueueWelcomeEmail,
        enqueueRawEmail,
        enqueueRoleNotification,
        enqueueUserNotification,
        enqueueFileGcDelete
    };
};
