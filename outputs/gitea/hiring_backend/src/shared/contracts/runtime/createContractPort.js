const { runValidator } = require('./validators');

const toError = (portName, errors = []) => {
    const message = [
        `Port contract validation failed for ${portName}:`,
        ...errors.map((error) => ` - ${error}`)
    ].join('\n');
    return new Error(message);
};

module.exports = ({ portName, methods = {} }) => {
    if (!portName) {
        throw new Error('Port name is required');
    }

    const missing = [];
    const port = {};

    for (const [methodName, spec] of Object.entries(methods)) {
        if (!spec || typeof spec.impl !== 'function') {
            missing.push(`${methodName} must define an impl() function`);
            continue;
        }

        port[methodName] = async (...args) => {
            const normalizedArgs = spec.input
                ? runValidator(spec.input, args, {
                    port: portName,
                    method: methodName,
                    direction: 'input',
                    path: '$'
                })
                : args;

            const result = await spec.impl(...normalizedArgs);

            return spec.output
                ? runValidator(spec.output, result, {
                    port: portName,
                    method: methodName,
                    direction: 'output',
                    path: '$'
                })
                : result;
        };
    }

    if (missing.length > 0) {
        throw toError(portName, missing);
    }

    return Object.freeze(port);
};
