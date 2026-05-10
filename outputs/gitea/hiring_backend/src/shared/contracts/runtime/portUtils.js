const { isPlainObject, cloneValue } = require('./cloneValue');

const cloneDto = (value) => cloneValue(value);

const cloneDtoArray = (values) => {
    if (!Array.isArray(values)) {
        return values;
    }

    return cloneValue(values);
};

const cloneOptions = (value) => (isPlainObject(value) ? { ...value } : {});

const requireServiceMethods = (service, dependencyName, portName, methodNames = []) => {
    const missing = methodNames.filter((methodName) => typeof service?.[methodName] !== 'function');

    if (missing.length > 0) {
        throw new Error([
            `Port dependency validation failed for ${portName}:`,
            ...missing.map((methodName) => ` - ${dependencyName}.${methodName} must be a function`)
        ].join('\n'));
    }

    return Object.fromEntries(
        methodNames.map((methodName) => [methodName, service[methodName].bind(service)])
    );
};

module.exports = {
    cloneDto,
    cloneDtoArray,
    cloneOptions,
    requireServiceMethods
};
