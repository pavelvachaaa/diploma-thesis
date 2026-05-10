const { PortContractError } = require('./errors');
const { isPlainObject, cloneValue } = require('./cloneValue');

const createValidator = (expected, parse) => Object.freeze({
    expected,
    parse
});

const makeError = (meta, expected, received, pathOverride = null) => new PortContractError({
    port: meta.port,
    method: meta.method,
    direction: meta.direction,
    path: pathOverride || meta.path || '$',
    expected,
    received
});

const runValidator = (validator, value, meta) => {
    if (!validator || typeof validator.parse !== 'function') {
        return value;
    }

    return validator.parse(value, meta);
};

const unknown = () => createValidator('unknown', (value) => cloneValue(value));

const nonEmptyString = (label = 'non-empty string') => createValidator(label, (value, meta) => {
    if (typeof value !== 'string' || value.trim().length === 0) {
        throw makeError(meta, label, value);
    }

    return value;
});

const booleanFlag = () => createValidator('boolean', (value, meta) => {
    if (typeof value !== 'boolean') {
        throw makeError(meta, 'boolean', value);
    }

    return value;
});

const numberRange = ({ min = Number.NEGATIVE_INFINITY, max = Number.POSITIVE_INFINITY } = {}) =>
    createValidator(`number(${min}..${max})`, (value, meta) => {
        if (typeof value !== 'number' || Number.isNaN(value) || value < min || value > max) {
            throw makeError(meta, `number(${min}..${max})`, value);
        }

        return value;
    });

const enumValue = (values = []) => {
    const allowed = [...new Set(values.map((value) => String(value)))];
    return createValidator(`one of [${allowed.join(', ')}]`, (value, meta) => {
        if (!allowed.includes(String(value))) {
            throw makeError(meta, `one of [${allowed.join(', ')}]`, value);
        }

        return value;
    });
};

const optional = (validator) => createValidator(`optional ${validator.expected}`, (value, meta) => {
    if (value === undefined) {
        return undefined;
    }

    return runValidator(validator, value, meta);
});

const nullable = (validator) => createValidator(`nullable ${validator.expected}`, (value, meta) => {
    if (value === null) {
        return null;
    }

    return runValidator(validator, value, meta);
});

const arrayOf = (validator) => createValidator(`array of ${validator.expected}`, (value, meta) => {
    if (!Array.isArray(value)) {
        throw makeError(meta, `array of ${validator.expected}`, value);
    }

    return value.map((entry, index) => runValidator(validator, entry, {
        ...meta,
        path: `${meta.path || '$'}[${index}]`
    }));
});

const objectShape = (shape = {}, { allowExtra = true, cloneResult = true } = {}) => createValidator('object', (value, meta) => {
    if (!isPlainObject(value)) {
        throw makeError(meta, 'object', value);
    }

    const result = allowExtra
        ? (cloneResult ? cloneValue(value) : { ...value })
        : {};

    for (const [key, validator] of Object.entries(shape)) {
        const childPath = `${meta.path || '$'}.${key}`;
        const parsed = runValidator(validator, value[key], {
            ...meta,
            path: childPath
        });

        if (parsed === undefined) {
            delete result[key];
            continue;
        }

        result[key] = parsed;
    }

    return result;
});

const tuple = (...validators) => createValidator(`tuple(${validators.map((validator) => validator.expected).join(', ')})`, (value, meta) => {
    if (!Array.isArray(value)) {
        throw makeError(meta, 'arguments array', value);
    }

    if (value.length > validators.length) {
        throw makeError(meta, `at most ${validators.length} arguments`, value.length, meta.path || '$');
    }

    return validators.map((validator, index) => runValidator(validator, value[index], {
        ...meta,
        path: `${meta.path || '$'}[${index}]`
    }));
});

module.exports = {
    createValidator,
    runValidator,
    unknown,
    nonEmptyString,
    booleanFlag,
    numberRange,
    enumValue,
    optional,
    nullable,
    arrayOf,
    objectShape,
    tuple,
    isPlainObject,
    cloneValue
};
