const isPlainObject = (value) => {
    return value !== null
        && typeof value === 'object'
        && !Array.isArray(value)
        && !(value instanceof Date);
};

const cloneValue = (value) => structuredClone(value);

module.exports = {
    isPlainObject,
    cloneValue
};
