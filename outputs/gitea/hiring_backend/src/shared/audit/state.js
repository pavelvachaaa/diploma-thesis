const createSnapshot = (entity, fields = []) => {
    if (!entity) return null;
    if (!Array.isArray(fields) || fields.length === 0) return null;

    const snapshot = {};
    for (const field of fields) {
        snapshot[field] = entity[field];
    }

    return snapshot;
};

const getChangedFields = (beforeState, afterState) => {
    if (!beforeState || !afterState) return [];
    if (typeof beforeState !== 'object' || typeof afterState !== 'object') return [];
    if (Array.isArray(beforeState) || Array.isArray(afterState)) return [];

    const keys = new Set([...Object.keys(beforeState), ...Object.keys(afterState)]);
    const changed = [];

    for (const key of keys) {
        if (JSON.stringify(beforeState[key]) !== JSON.stringify(afterState[key])) {
            changed.push(key);
        }
    }

    return changed;
};

module.exports = {
    createSnapshot,
    getChangedFields
};
