const amqp = require('amqplib');

const parseIntEnv = (name, fallback) => {
    const value = Number(process.env[name] || fallback);
    return Number.isFinite(value) && value > 0 ? Math.trunc(value) : fallback;
};

const createPermanentConsumerError = (message, code = 'RABBIT_CONSUMER_PERMANENT_ERROR') => {
    const error = new Error(message);
    error.code = code;
    error.isPermanent = true;
    return error;
};

const createConsumerRunner = ({
    logger,
    consumer,
    exchange,
    queue,
    routingKey,
    queueOptions = {
        durable: true
    },
    parseMessage = (raw) => JSON.parse(raw),
    handleMessage,
    prefetch = parseIntEnv('RABBIT_CONSUMER_PREFETCH', 1),
    maxAttempts = parseIntEnv('RABBIT_CONSUMER_MAX_ATTEMPTS', 8),
    retryBaseMs = parseIntEnv('RABBIT_CONSUMER_RETRY_BASE_MS', 1000),
    retryMaxMs = parseIntEnv('RABBIT_CONSUMER_RETRY_MAX_MS', 300000),
    connectRetryBaseMs = parseIntEnv('RABBIT_CONSUMER_CONNECT_RETRY_BASE_MS', 5000),
    connectRetryMaxMs = parseIntEnv('RABBIT_CONSUMER_CONNECT_RETRY_MAX_MS', 60000)
}) => {
    if (!logger) {
        throw new Error('logger is required for consumer runner');
    }
    if (!consumer || !exchange || !queue || !routingKey) {
        throw new Error('consumer, exchange, queue, and routingKey are required for consumer runner');
    }
    if (typeof handleMessage !== 'function') {
        throw new Error('handleMessage function is required for consumer runner');
    }

    const retryQueue = `${queue}.retry`;
    const retryRoutingKey = `${routingKey}.retry`;
    const deadQueue = `${queue}.dead`;
    const deadRoutingKey = `${routingKey}.dead`;
    const url = process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672/';

    let connection = null;
    let channel = null;
    let running = false;
    let reconnectTimer = null;
    let reconnectAttempt = 0;

    const computeBackoffMs = (attempt) => {
        const exponent = Math.max(0, attempt - 1);
        return Math.min(retryMaxMs, retryBaseMs * (2 ** exponent));
    };

    const buildLogContext = ({
        message = null,
        attempt = null,
        retryDelayMs = null,
        outcome = null,
        errorCode = null,
        maxAttemptsValue = maxAttempts
    } = {}) => ({
        consumer,
        queue,
        exchange,
        routing_key: routingKey,
        message_id: message?.properties?.messageId || null,
        correlation_id: message?.properties?.correlationId || null,
        attempt,
        max_attempts: maxAttemptsValue,
        retry_delay_ms: retryDelayMs,
        outcome,
        error_code: errorCode
    });

    const safeCloseChannel = async () => {
        if (!channel) return;

        try {
            await channel.close();
        } catch (error) {
            logger.warn('Failed to close Rabbit consumer channel', {
                ...buildLogContext({ outcome: 'close_channel_error', errorCode: error.code || null }),
                error: error.message
            });
        } finally {
            channel = null;
        }
    };

    const safeCloseConnection = async () => {
        if (!connection) return;

        try {
            await connection.close();
        } catch (error) {
            logger.warn('Failed to close Rabbit consumer connection', {
                ...buildLogContext({ outcome: 'close_connection_error', errorCode: error.code || null }),
                error: error.message
            });
        } finally {
            connection = null;
        }
    };

    const safeNackRequeue = (message, error) => {
        try {
            channel.nack(message, false, true);
        } catch (nackError) {
            logger.error('Failed to nack/requeue Rabbit consumer message', {
                ...buildLogContext({
                    message,
                    attempt: Number(message?.properties?.headers?.['x-consumer-attempt'] || 1),
                    outcome: 'nack_requeue_failed',
                    errorCode: nackError.code || null
                }),
                error: nackError.message
            });
        }

        logger.error('Rabbit consumer fallback nack(requeue=true)', {
            ...buildLogContext({
                message,
                attempt: Number(message?.properties?.headers?.['x-consumer-attempt'] || 1),
                outcome: 'nack_requeue',
                errorCode: error?.code || null
            }),
            error: error?.message || null
        });
    };

    const publishWithHeaders = async ({ message, routingKeyOverride, headers = {}, expiration = null }) => {
        const published = channel.publish(
            exchange,
            routingKeyOverride,
            message.content,
            {
                persistent: true,
                contentType: message.properties.contentType || 'application/json',
                contentEncoding: message.properties.contentEncoding || undefined,
                messageId: message.properties.messageId || undefined,
                correlationId: message.properties.correlationId || undefined,
                timestamp: Date.now(),
                headers: {
                    ...(message.properties.headers || {}),
                    ...headers
                },
                expiration: expiration ? String(expiration) : undefined
            }
        );

        if (!published) {
            await channel.waitForConfirms();
            return true;
        }

        await channel.waitForConfirms();
        return true;
    };

    const scheduleReconnect = (error = null) => {
        if (!running || reconnectTimer) {
            return;
        }

        const delay = Math.min(connectRetryMaxMs, connectRetryBaseMs * (2 ** reconnectAttempt));
        reconnectAttempt += 1;

        logger.warn('Rabbit consumer reconnect scheduled', {
            ...buildLogContext({
                attempt: reconnectAttempt,
                maxAttemptsValue: null,
                retryDelayMs: delay,
                outcome: 'reconnect_scheduled',
                errorCode: error?.code || null
            }),
            error: error?.message || null
        });

        reconnectTimer = setTimeout(() => {
            reconnectTimer = null;
            void connectAndConsume();
        }, delay);
    };

    const setupTopology = async () => {
        await channel.assertExchange(exchange, 'topic', { durable: true });
        await channel.assertQueue(queue, queueOptions);
        await channel.bindQueue(queue, exchange, routingKey);

        await channel.assertQueue(retryQueue, {
            durable: true,
            arguments: {
                'x-dead-letter-exchange': exchange,
                'x-dead-letter-routing-key': routingKey
            }
        });
        await channel.bindQueue(retryQueue, exchange, retryRoutingKey);

        await channel.assertQueue(deadQueue, { durable: true });
        await channel.bindQueue(deadQueue, exchange, deadRoutingKey);
    };

    const onMessage = async (message) => {
        if (!message) {
            return;
        }

        const headers = message.properties.headers || {};
        const attempt = Math.max(1, Number(headers['x-consumer-attempt'] || 1));

        try {
            const raw = message.content.toString();
            let payload = raw;
            if (parseMessage) {
                try {
                    payload = parseMessage(raw, message);
                } catch (parseError) {
                    throw createPermanentConsumerError(
                        `Failed to parse message payload: ${parseError.message}`,
                        'RABBIT_CONSUMER_INVALID_PAYLOAD'
                    );
                }
            }

            await handleMessage({
                payload,
                raw,
                message,
                headers,
                attempt
            });

            channel.ack(message);
            logger.info('Rabbit consumer message processed', buildLogContext({
                message,
                attempt,
                outcome: 'ack'
            }));
        } catch (error) {
            const isPermanent = error?.isPermanent === true;
            const errorCode = error?.code || null;

            if (!isPermanent && attempt < maxAttempts) {
                const retryDelayMs = computeBackoffMs(attempt);

                try {
                    await publishWithHeaders({
                        message,
                        routingKeyOverride: retryRoutingKey,
                        headers: {
                            'x-consumer-attempt': attempt + 1,
                            'x-last-error-code': errorCode,
                            'x-last-error-message': String(error.message || '').slice(0, 500)
                        },
                        expiration: retryDelayMs
                    });

                    channel.ack(message);
                    logger.warn('Rabbit consumer retry scheduled', {
                        ...buildLogContext({
                            message,
                            attempt,
                            retryDelayMs,
                            outcome: 'retry',
                            errorCode
                        }),
                        error: error.message
                    });
                    return;
                } catch (publishRetryError) {
                    safeNackRequeue(message, publishRetryError);
                    return;
                }
            }

            try {
                await publishWithHeaders({
                    message,
                    routingKeyOverride: deadRoutingKey,
                    headers: {
                        'x-consumer-attempt': attempt,
                        'x-last-error-code': errorCode,
                        'x-last-error-message': String(error.message || '').slice(0, 500),
                        'x-dead-letter-reason': isPermanent ? 'permanent_error' : 'max_attempts_exhausted'
                    }
                });

                channel.ack(message);
                logger.error('Rabbit consumer message moved to dead-letter', {
                    ...buildLogContext({
                        message,
                        attempt,
                        outcome: 'dead',
                        errorCode
                    }),
                    error: error.message
                });
            } catch (publishDeadError) {
                safeNackRequeue(message, publishDeadError);
            }
        }
    };

    const connectAndConsume = async () => {
        if (!running) {
            return;
        }

        try {
            await safeCloseChannel();
            await safeCloseConnection();

            connection = await amqp.connect(url);

            connection.on('error', (error) => {
                logger.error('Rabbit consumer connection error', {
                    ...buildLogContext({ outcome: 'connection_error', errorCode: error.code || null }),
                    error: error.message
                });
            });

            connection.on('close', () => {
                channel = null;
                connection = null;
                if (running) {
                    scheduleReconnect();
                }
            });

            channel = await connection.createConfirmChannel();
            await setupTopology();
            await channel.prefetch(prefetch);
            await channel.consume(queue, (message) => {
                void onMessage(message);
            });

            reconnectAttempt = 0;
            logger.info('Rabbit consumer started', buildLogContext({
                attempt: 1,
                maxAttemptsValue: maxAttempts,
                outcome: 'started'
            }));
        } catch (error) {
            logger.error('Rabbit consumer start failed', {
                ...buildLogContext({
                    attempt: reconnectAttempt + 1,
                    maxAttemptsValue: null,
                    outcome: 'start_failed',
                    errorCode: error.code || null
                }),
                error: error.message
            });
            scheduleReconnect(error);
        }
    };

    const start = async () => {
        if (running) {
            return;
        }

        running = true;
        reconnectAttempt = 0;
        await connectAndConsume();
    };

    const stop = async () => {
        running = false;

        if (reconnectTimer) {
            clearTimeout(reconnectTimer);
            reconnectTimer = null;
        }

        await safeCloseChannel();
        await safeCloseConnection();

        logger.info('Rabbit consumer stopped', buildLogContext({
            outcome: 'stopped',
            maxAttemptsValue: null
        }));
    };

    return {
        start,
        stop
    };
};

module.exports = {
    createConsumerRunner,
    createPermanentConsumerError
};
