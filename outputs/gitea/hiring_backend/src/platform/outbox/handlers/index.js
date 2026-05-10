const { normalizeEventType, createPermanentHandlerError } = require('./shared');
const createEmailHandlers = require('./email');
const createNotificationHandlers = require('./notifications');
const createRabbitmqHandlers = require('./rabbitmq');
const createFileGcHandlers = require('./fileGc');
const createRebacHandlers = require('./rebac');

module.exports = ({
    mailer,
    notificationService,
    rabbitmqService,
    storageService,
    fileGateway,
    transformer,
    eventTypes,
    rebacService
}) => {
    const strategies = [
        ...createEmailHandlers({
            mailer,
            transformer,
            eventTypes
        }),
        ...createNotificationHandlers({
            notificationService,
            eventTypes
        }),
        ...createRabbitmqHandlers({
            rabbitmqService,
            eventTypes
        }),
        ...createFileGcHandlers({
            storageService,
            fileGateway,
            createPermanentHandlerError,
            eventTypes
        }),
        ...createRebacHandlers({
            rebacService,
            eventTypes
        })
    ];

    const validateStrategies = () => {
        const keys = new Set();

        for (const strategy of strategies) {
            if (keys.has(strategy.key)) {
                throw new Error(`Duplicate side effect outbox strategy key: ${strategy.key}`);
            }

            keys.add(strategy.key);
        }

        const canonicalEventTypes = [...new Set(
            Object.values(eventTypes || {})
                .map((value) => normalizeEventType(value))
                .filter(Boolean)
        )];

        for (const canonicalEventType of canonicalEventTypes) {
            const matching = strategies.filter((strategy) => strategy.supports(canonicalEventType));

            if (matching.length === 0) {
                throw new Error(`No side effect outbox strategy registered for canonical event type: ${canonicalEventType}`);
            }

            if (matching.length > 1) {
                throw new Error(
                    `Canonical side effect outbox event type "${canonicalEventType}" matched multiple strategies: ${matching.map((strategy) => strategy.key).join(', ')}`
                );
            }
        }
    };

    validateStrategies();

    const resolveStrategy = (eventType) => {
        const normalizedEventType = normalizeEventType(eventType);

        if (!normalizedEventType) {
            throw createPermanentHandlerError('Unsupported side effect outbox event type: <empty>');
        }

        const matching = strategies.filter((strategy) => strategy.supports(normalizedEventType));

        if (matching.length === 0) {
            throw createPermanentHandlerError(`Unsupported side effect outbox event type: ${eventType}`);
        }

        if (matching.length > 1) {
            throw createPermanentHandlerError(
                `Ambiguous side effect outbox event type: ${eventType}`,
                'SIDE_EFFECT_OUTBOX_AMBIGUOUS_EVENT'
            );
        }

        return matching[0];
    };

    const dispatchEvent = async (event) => {
        const strategy = resolveStrategy(event?.event_type);
        return strategy.dispatch(event);
    };

    const getSupportedEventTypes = () => {
        const all = new Set();
        for (const strategy of strategies) {
            for (const type of strategy.eventTypes) {
                all.add(type);
            }
        }
        return all;
    };

    const isEventTypeSupported = (eventType) => {
        try {
            resolveStrategy(eventType);
            return true;
        } catch (_error) {
            return false;
        }
    };

    const supportedEventTypes = Object.fromEntries(
        strategies.map((strategy) => [strategy.key, Array.from(strategy.eventTypes)])
    );

    return {
        normalizeEventType,
        createPermanentHandlerError,
        strategies,
        resolveStrategy,
        dispatchEvent,
        getSupportedEventTypes,
        isEventTypeSupported,
        supportedEventTypes
    };
};
