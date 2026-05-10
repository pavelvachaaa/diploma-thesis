module.exports = ({
    logger,
    cleanupExpiredMembershipPermissions,
    repairMembershipPermissions
}) => {
    const cleanupIntervalMs = 60 * 1000;
    const repairIntervalMs = 24 * 60 * 60 * 1000;
    let cleanupTimer = null;
    let repairTimer = null;

    const start = async () => {
        if (cleanupTimer || repairTimer) {
            return true;
        }

        cleanupTimer = setInterval(() => {
            void cleanupExpiredMembershipPermissions().catch((error) => {
                logger?.warn?.('ReBAC cleanup interval failed', {
                    error: error.message
                });
            });
        }, cleanupIntervalMs);

        repairTimer = setInterval(() => {
            void repairMembershipPermissions().catch((error) => {
                logger?.warn?.('ReBAC repair interval failed', {
                    error: error.message
                });
            });
        }, repairIntervalMs);

        if (typeof cleanupTimer.unref === 'function') {
            cleanupTimer.unref();
        }
        if (typeof repairTimer.unref === 'function') {
            repairTimer.unref();
        }

        await cleanupExpiredMembershipPermissions();
        logger?.info?.('Started ReBAC reconciler', {
            cleanupIntervalMs,
            repairIntervalMs
        });
        return true;
    };

    const stop = async () => {
        if (cleanupTimer) {
            clearInterval(cleanupTimer);
            cleanupTimer = null;
        }
        if (repairTimer) {
            clearInterval(repairTimer);
            repairTimer = null;
        }
    };

    return {
        start,
        stop
    };
};
