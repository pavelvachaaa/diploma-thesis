module.exports = ({
    sideEffectOutboxRepository,
    logger,
    audit,
    config,
    handlers,
    reliability,
    workerId
}) => {
    let running = false;
    let poller = null;
    let processing = false;

    const buildLogContext = ({
        event = null,
        outcome = null,
        attempts = null,
        maxAttempts = null,
        retryDelayMs = null,
        errorCode = null
    } = {}) => ({
        worker_id: workerId,
        outbox_id: event?.id || null,
        event_type: event?.event_type || null,
        aggregate_type: event?.aggregate_type || null,
        aggregate_id: event?.aggregate_id || null,
        attempt: attempts,
        max_attempts: maxAttempts,
        retry_delay_ms: retryDelayMs,
        outcome,
        error_code: errorCode
    });

    const emitDeadLetterAudit = async ({ event, errorMessage, attempts, maxAttempts }) => {
        const payload = event?.payload || {};

        try {
            await audit.writeAuditEvent({
                category: 'side_effect',
                action: 'side_effect.outbox.dead',
                status: 'failure',
                source: 'outbox-worker',
                organizationId: event.organization_id || payload.organizationId || null,
                resourceType: event.aggregate_type || null,
                resourceId: event.aggregate_id || null,
                errorMessage,
                metadata: {
                    outboxId: event.id,
                    outboxEventType: event.event_type,
                    outboxStatus: 'dead',
                    attempts,
                    maxAttempts,
                    eventType: event.event_type
                }
            });
        } catch (auditError) {
            logger.warn('Failed to emit side effect outbox dead-letter audit event', {
                error: auditError.message,
                outboxId: event?.id || null
            });
        }
    };

    const processPendingBatch = async () => {
        if (!config.isEnabled()) {
            return { claimed: 0, sent: 0, failed: 0, dead: 0, staleRequeued: 0 };
        }

        const staleRequeued = await sideEffectOutboxRepository.requeueStaleProcessing(config.getLockTimeoutSeconds());

        const stats = {
            claimed: 0,
            sent: 0,
            failed: 0,
            dead: 0,
            staleRequeued
        };

        for (let i = 0; i < config.getBatchSize(); i += 1) {
            const claimed = await sideEffectOutboxRepository.claimPendingBatch({
                limit: 1,
                workerId
            });
            const event = claimed[0] || null;

            if (!event) {
                break;
            }

            stats.claimed += 1;

            try {
                const resultMeta = await handlers.dispatchEvent(event);
                const sent = reliability.createSentOutcome(resultMeta);
                await sideEffectOutboxRepository.markSent({
                    id: event.id,
                    resultMeta: {
                        ...sent.resultMeta,
                        outcome: sent.outcome
                    }
                });
                stats.sent += 1;
                const retryPolicy = reliability.getRetryPolicy({
                    eventType: event.event_type,
                    eventMaxAttempts: Number(event.max_attempts || 0) || null
                });
                logger.info('Side effect outbox event dispatched', buildLogContext({
                    event,
                    outcome: sent.outcome,
                    attempts: Number(event.attempts || 0),
                    maxAttempts: retryPolicy.maxAttempts
                }));
            } catch (error) {
                const attempts = Number(event.attempts || 0);
                const retryPolicy = reliability.getRetryPolicy({
                    eventType: event.event_type,
                    eventMaxAttempts: Number(event.max_attempts || 0) || null
                });
                const maxAttempts = retryPolicy.maxAttempts;
                const failure = reliability.classifyFailure({
                    error,
                    attempts,
                    maxAttempts,
                    retryPolicy
                });
                const moveToDead = failure.outcome === 'dead';

                await sideEffectOutboxRepository.markFailed({
                    id: event.id,
                    errorMessage: String(error.message || 'Unknown outbox processing error').slice(0, 2000),
                    nextAvailableAt: failure.nextAvailableAt,
                    moveToDead,
                    resultMeta: {
                        errorCode: failure.errorCode,
                        outcome: failure.outcome,
                        classification: failure.classification
                    }
                });

                if (moveToDead) {
                    stats.dead += 1;
                    await emitDeadLetterAudit({
                        event,
                        errorMessage: String(error.message || 'Unknown outbox processing error').slice(0, 2000),
                        attempts,
                        maxAttempts
                    });
                } else {
                    stats.failed += 1;
                }

                logger.error('Side effect outbox dispatch failed', {
                    ...buildLogContext({
                        event,
                        outcome: failure.outcome,
                        attempts,
                        maxAttempts,
                        retryDelayMs: failure.retryDelayMs,
                        errorCode: failure.errorCode
                    }),
                    error: error.message,
                    failureClassification: failure.classification,
                    isPermanent: failure.classification === 'permanent',
                    moveToDead,
                    normalizedEventType: handlers.normalizeEventType(event.event_type)
                });
            }
        }

        if (stats.claimed > 0 || stats.staleRequeued > 0) {
            logger.info('Processed side effect outbox batch', stats);
        }

        return stats;
    };

    const tick = async () => {
        if (!running || processing) {
            return;
        }

        processing = true;
        try {
            await processPendingBatch();
        } catch (error) {
            logger.error('Side effect outbox tick failed', {
                ...buildLogContext({
                    outcome: 'tick_failed',
                    errorCode: error.code || null
                }),
                error: error.message
            });
        } finally {
            processing = false;
        }
    };

    const start = async () => {
        if (!config.isWorkerEnabled()) {
            return false;
        }

        if (running) {
            return true;
        }

        running = true;

        logger.info('Starting side effect outbox worker', {
            ...buildLogContext({
                outcome: 'worker_started'
            }),
            batchSize: config.getBatchSize(),
            pollIntervalMs: config.getPollIntervalMs(),
            lockTimeoutSeconds: config.getLockTimeoutSeconds(),
            supportedEventTypes: handlers.supportedEventTypes
        });

        // Do not block application boot on the first outbox dispatch attempt.
        // External handlers (SMTP/RabbitMQ/storage) may hang transiently and
        // startup still needs to complete so the API can come up.
        void tick();

        poller = setInterval(() => {
            void tick();
        }, config.getPollIntervalMs());

        return true;
    };

    const stop = async () => {
        running = false;
        if (poller) {
            clearInterval(poller);
            poller = null;
        }
    };

    return {
        processPendingBatch,
        start,
        stop
    };
};
