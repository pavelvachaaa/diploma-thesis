const crypto = require('node:crypto');
const { getRequestContext } = require('@shared/requestContext');
const createConfig = require('./config');
const createReliability = require('./reliability');
const createTransformer = require('./transformer');
const createProducer = require('./producer');
const createHandlers = require('./handlers');
const createWorker = require('./worker');
const createOperations = require('./operations');
const { EVENT_TYPES } = require('./constants');

module.exports = ({
    sideEffectOutboxRepository,
    mailer,
    notificationService,
    rabbitmqService,
    logger,
    audit,
    storageService,
    fileGateway,
    rebacService
}) => {
    const config = createConfig();
    const reliability = createReliability({
        config,
        eventTypes: EVENT_TYPES
    });

    const transformer = createTransformer({
        config,
        storageService
    });

    const producer = createProducer({
        sideEffectOutboxRepository,
        getRequestContext,
        config,
        transformer,
        eventTypes: EVENT_TYPES
    });

    const handlers = createHandlers({
        mailer,
        notificationService,
        rabbitmqService,
        storageService,
        fileGateway,
        transformer,
        eventTypes: EVENT_TYPES,
        rebacService
    });

    const worker = createWorker({
        sideEffectOutboxRepository,
        logger,
        audit,
        config,
        handlers,
        reliability,
        workerId: `${process.pid}-${crypto.randomUUID()}`
    });

    const operations = createOperations({
        sideEffectOutboxRepository,
        logger,
        audit
    });

    const buildWelcomePayload = ({ employee, plainPassword, loginUrl = null }) => {
        const defaultLoginUrl = process.env.FRONTEND_URL
            ? `${process.env.FRONTEND_URL}/login`
            : 'https://onboarding.kzcr.eu/login';

        return {
            to: employee.email,
            employeeName: `${employee.name} ${employee.surname || ''}`.trim(),
            username: employee.email,
            loginUrl: loginUrl || defaultLoginUrl,
            organizationName: employee.organization_name || 'Krajská Zdravotní a.s.',
            encryptedPassword: transformer.encryptSecret(plainPassword)
        };
    };

    return {
        EVENT_TYPES,
        isEnabled: config.isEnabled,
        isWorkerEnabled: config.isWorkerEnabled,
        enqueue: producer.enqueue,
        enqueueWelcomeEmail: producer.enqueueWelcomeEmail,
        enqueueRawEmail: producer.enqueueRawEmail,
        enqueueRoleNotification: producer.enqueueRoleNotification,
        enqueueUserNotification: producer.enqueueUserNotification,
        enqueueFileGcDelete: producer.enqueueFileGcDelete,
        processPendingBatch: worker.processPendingBatch,
        start: worker.start,
        stop: worker.stop,
        inspectSummary: operations.inspectSummary,
        listEvents: operations.listEvents,
        previewReplayDead: operations.previewReplayDead,
        replayDead: operations.replayDead,
        getSupportedEventTypes: handlers.getSupportedEventTypes,
        isSupportedEventType: handlers.isEventTypeSupported,
        getRetryPolicyByEventType: () => reliability.policyByEventType,

        // Shared serialization helpers for producer callsites.
        encryptSecret: transformer.encryptSecret,
        decryptSecret: transformer.decryptSecret,
        normalizeAttachmentsForPayload: transformer.normalizeAttachmentsForPayload,
        normalizeIcalEventForPayload: transformer.normalizeIcalEventForPayload,
        materializeAttachmentsFromPayload: transformer.materializeAttachmentsFromPayload,
        materializeIcalEventFromPayload: transformer.materializeIcalEventFromPayload,
        buildWelcomePayload
    };
};
