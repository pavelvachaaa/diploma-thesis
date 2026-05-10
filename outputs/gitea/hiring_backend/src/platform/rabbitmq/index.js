const amqp = require('amqplib');

class RabbitMQService {
    constructor({ logger }) {
        this.logger = logger;
        this.connection = null;
        this.channel = null;
        this.confirmChannel = null;
        this.cvExchange = 'cv_events';
        this.cvQueue = 'cv_processing';
        this.auditExchange = process.env.AUDIT_EXCHANGE || 'audit_events';
        this.auditQueue = process.env.AUDIT_QUEUE || 'audit_writer';
        this.auditRoutingKey = process.env.AUDIT_ROUTING_KEY || 'audit.event';
        this.auditDeadRoutingKey = process.env.AUDIT_DEAD_ROUTING_KEY || `${this.auditRoutingKey}.dead`;
        this.connectPromise = null;
    }

    async connect() {
        if (this.channel) return;
        if (this.connectPromise) {
            await this.connectPromise;
            return;
        }

        this.connectPromise = (async () => {
            const url = process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672/';
            try {
                this.connection = await amqp.connect(url);

                this.connection.on('error', (err) => {
                    this.logger.error('RabbitMQ connection error', { error: err.message });
                    this.channel = null;
                    this.confirmChannel = null;
                    this.connection = null;
                });

                this.connection.on('close', () => {
                    this.logger.warn('RabbitMQ connection closed');
                    this.channel = null;
                    this.confirmChannel = null;
                    this.connection = null;
                });

                this.channel = await this.connection.createChannel();
                this.confirmChannel = await this.connection.createConfirmChannel();

                await this.setupCVTopology(this.channel);
                await this.setupCVTopology(this.confirmChannel);
                await this.setupAuditTopology(this.channel);

                this.logger.info('RabbitMQ connected and configured', {
                    cvExchange: this.cvExchange,
                    cvQueue: this.cvQueue,
                    auditExchange: this.auditExchange,
                    auditQueue: this.auditQueue
                });
            } catch (err) {
                this.logger.error('Failed to connect to RabbitMQ', { error: err.message });
                this.channel = null;
                this.confirmChannel = null;
                this.connection = null;
            } finally {
                this.connectPromise = null;
            }
        })();

        await this.connectPromise;
    }

    async setupCVTopology(channel) {
        await channel.assertExchange(this.cvExchange, 'topic', { durable: true });
        await channel.assertQueue(this.cvQueue, {
            durable: true,
            arguments: {
                'x-message-ttl': 86400000
            }
        });
        await channel.bindQueue(this.cvQueue, this.cvExchange, 'cv.uploaded');

        await channel.assertQueue('job_seeker_cv_processing', {
            durable: true,
            arguments: {
                'x-message-ttl': 86400000
            }
        });
        await channel.bindQueue('job_seeker_cv_processing', this.cvExchange, 'job_seeker_cv.uploaded');

        await channel.assertQueue('job_embedding_processing', {
            durable: true,
            arguments: {
                'x-message-ttl': 86400000
            }
        });
        await channel.bindQueue('job_embedding_processing', this.cvExchange, 'job.embedding.requested');
    }

    async setupAuditTopology(channel) {
        await channel.assertExchange(this.auditExchange, 'topic', { durable: true });

        const deadQueue = `${this.auditQueue}.dead`;
        await channel.assertQueue(deadQueue, { durable: true });
        await channel.bindQueue(deadQueue, this.auditExchange, this.auditDeadRoutingKey);

        await channel.assertQueue(this.auditQueue, {
            durable: true,
            arguments: {
                'x-dead-letter-exchange': this.auditExchange,
                'x-dead-letter-routing-key': this.auditDeadRoutingKey
            }
        });

        await channel.bindQueue(this.auditQueue, this.auditExchange, this.auditRoutingKey);
    }

    async publishEvent(exchange, routingKey, message, logContext = {}) {
        try {
            await this.connect();

            if (!this.channel) {
                this.logger.warn('RabbitMQ channel not available, skipping event publish', {
                    exchange,
                    routingKey,
                    ...logContext
                });
                return false;
            }

            const payload = Buffer.from(JSON.stringify(message));

            this.channel.publish(exchange, routingKey, payload, {
                persistent: true,
                contentType: 'application/json',
                timestamp: Date.now()
            });

            this.logger.info('RabbitMQ event published', {
                exchange,
                routingKey,
                ...logContext
            });

            return true;
        } catch (err) {
            this.logger.error('Failed to publish event to RabbitMQ', {
                error: err.message,
                exchange,
                routingKey,
                ...logContext
            });
            return false;
        }
    }

    async publishEventWithConfirm(exchange, routingKey, message, logContext = {}) {
        try {
            await this.connect();

            if (!this.confirmChannel) {
                this.logger.warn('RabbitMQ confirm channel not available, skipping event publish', {
                    exchange,
                    routingKey,
                    ...logContext
                });
                return false;
            }

            const payload = Buffer.from(JSON.stringify(message));

            const published = await new Promise((resolve, reject) => {
                this.confirmChannel.publish(
                    exchange,
                    routingKey,
                    payload,
                    {
                        persistent: true,
                        contentType: 'application/json',
                        timestamp: Date.now()
                    },
                    (err) => {
                        if (err) {
                            reject(err);
                            return;
                        }
                        resolve(true);
                    }
                );
            });

            if (published) {
                this.logger.info('RabbitMQ event published (confirmed)', {
                    exchange,
                    routingKey,
                    ...logContext
                });
            }

            return published;
        } catch (err) {
            this.logger.error('Failed to publish confirmed event to RabbitMQ', {
                error: err.message,
                exchange,
                routingKey,
                ...logContext
            });
            return false;
        }
    }

    async publishCVEvent(message) {
        return this.publishEvent(this.cvExchange, 'cv.uploaded', message, {
            eventType: 'cv.uploaded',
            attachment_id: message.attachment_id,
            applicant_id: message.applicant_id,
            original_filename: message.original_filename
        });
    }

    async publishCVEventConfirmed(message) {
        return this.publishEventWithConfirm(this.cvExchange, 'cv.uploaded', message, {
            eventType: 'cv.uploaded',
            attachment_id: message.attachment_id,
            applicant_id: message.applicant_id,
            original_filename: message.original_filename
        });
    }

    async publishJobSeekerCVEvent(message) {
        return this.publishEvent(this.cvExchange, 'job_seeker_cv.uploaded', message, {
            eventType: 'job_seeker_cv.uploaded',
            job_seeker_id: message.job_seeker_id,
            original_filename: message.original_filename
        });
    }

    async publishJobSeekerCVEventConfirmed(message) {
        return this.publishEventWithConfirm(this.cvExchange, 'job_seeker_cv.uploaded', message, {
            eventType: 'job_seeker_cv.uploaded',
            job_seeker_id: message.job_seeker_id,
            original_filename: message.original_filename
        });
    }

    async publishJobEmbeddingRequest(message) {
        return this.publishEvent(this.cvExchange, 'job.embedding.requested', message, {
            eventType: 'job.embedding.requested',
            job_id: message.job_id,
            content_hash: message.content_hash
        });
    }

    async publishJobEmbeddingRequestConfirmed(message) {
        return this.publishEventWithConfirm(this.cvExchange, 'job.embedding.requested', message, {
            eventType: 'job.embedding.requested',
            job_id: message.job_id,
            content_hash: message.content_hash
        });
    }

    async publishAuditEvent(message) {
        if ((process.env.AUDIT_ENABLED || 'true') === 'false') {
            return false;
        }

        return this.publishEvent(this.auditExchange, this.auditRoutingKey, message, {
            eventType: this.auditRoutingKey,
            category: message?.category,
            action: message?.action,
            status: message?.status
        });
    }

    async close() {
        try {
            if (this.confirmChannel) {
                await this.confirmChannel.close();
                this.confirmChannel = null;
            }
            if (this.channel) {
                await this.channel.close();
                this.channel = null;
            }
            if (this.connection) {
                await this.connection.close();
                this.connection = null;
            }
            this.logger.info('RabbitMQ connection closed gracefully');
        } catch (err) {
            this.logger.error('Error closing RabbitMQ connection', { error: err.message });
        }
    }
}

module.exports = ({ logger }) => {
    return new RabbitMQService({ logger });
};
