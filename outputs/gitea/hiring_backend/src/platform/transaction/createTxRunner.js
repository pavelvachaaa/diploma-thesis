const { getRequestContext } = require('@shared/requestContext');

module.exports = ({
    db,
    transactionManager,
    logger,
    defaultLabel = 'transaction'
}) => {
    const runInTransaction = async (callback, options = {}) => {
        const label = options.label || defaultLabel;

        if (transactionManager?.runInTransaction) {
            return transactionManager.runInTransaction(callback, {
                ...options,
                label
            });
        }

        if (!db?.getClient) {
            throw new Error('db.getClient or transactionManager.runInTransaction is required');
        }

        const client = await db.getClient();
        const context = getRequestContext();
        const startedAt = Date.now();

        try {
            await client.query('BEGIN');
            const result = await callback(client);
            await client.query('COMMIT');

            logger?.debug?.('Transaction committed', {
                label,
                duration_ms: Date.now() - startedAt,
                request_id: options.requestId || context.requestId || null
            });

            return result;
        } catch (error) {
            let rollbackError = null;
            try {
                await client.query('ROLLBACK');
            } catch (rollbackFailure) {
                rollbackError = rollbackFailure;
                logger?.error?.('Transaction rollback failed', {
                    label,
                    duration_ms: Date.now() - startedAt,
                    request_id: options.requestId || context.requestId || null,
                    error: rollbackFailure.message
                });
            }

            logger?.warn?.('Transaction rolled back', {
                label,
                duration_ms: Date.now() - startedAt,
                request_id: options.requestId || context.requestId || null,
                error: error.message,
                rollback_error: rollbackError?.message || null
            });

            throw error;
        } finally {
            client.release();
        }
    };

    const runWriteWithOutbox = async ({
        label = `${defaultLabel}.write_outbox`,
        write,
        enqueue
    }) => {
        if (typeof write !== 'function') {
            throw new Error('write function is required');
        }

        if (typeof transactionManager?.runWriteWithOutbox === 'function') {
            return transactionManager.runWriteWithOutbox({
                label,
                write,
                enqueue
            });
        }

        return runInTransaction(async (client) => {
            const writeResult = await write({ client });
            const outboxResult = typeof enqueue === 'function'
                ? await enqueue({ client, writeResult })
                : null;

            return {
                writeResult,
                outboxResult
            };
        }, { label });
    };

    return {
        runInTransaction,
        runWriteWithOutbox
    };
};
