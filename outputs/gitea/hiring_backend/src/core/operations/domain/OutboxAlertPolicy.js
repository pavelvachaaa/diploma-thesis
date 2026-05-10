const toPositiveInt = (value, fallback) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? Math.trunc(parsed) : fallback;
};

const countDeadEvents = (summary = []) => summary
    .filter((entry) => entry.status === 'dead')
    .reduce((acc, entry) => acc + Number(entry.count || 0), 0);

const createThresholds = (raw = {}) => Object.freeze({
    oldestPendingSec: toPositiveInt(raw.oldestPendingSec, 900),
    oldestProcessingSec: toPositiveInt(raw.oldestProcessingSec, 600),
    deadCount: toPositiveInt(raw.deadCount, 50)
});

const evaluate = (snapshot = {}, rawThresholds = {}) => {
    const thresholds = createThresholds(rawThresholds);
    const oldestPendingAgeSec = snapshot.operability?.oldestPendingAgeSec ?? null;
    const oldestProcessingAgeSec = snapshot.operability?.oldestProcessingAgeSec ?? null;
    const deadTotal = countDeadEvents(snapshot.summary || []);

    return Object.freeze({
        oldest_pending: Object.freeze({
            breached: oldestPendingAgeSec !== null && oldestPendingAgeSec > thresholds.oldestPendingSec,
            value: oldestPendingAgeSec,
            threshold: thresholds.oldestPendingSec
        }),
        oldest_processing: Object.freeze({
            breached: oldestProcessingAgeSec !== null && oldestProcessingAgeSec > thresholds.oldestProcessingSec,
            value: oldestProcessingAgeSec,
            threshold: thresholds.oldestProcessingSec
        }),
        dead_total: Object.freeze({
            breached: deadTotal > thresholds.deadCount,
            value: deadTotal,
            threshold: thresholds.deadCount
        })
    });
};

module.exports = Object.freeze({
    createThresholds,
    evaluate
});
