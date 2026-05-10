class PortContractError extends Error {
    constructor({
        port,
        method,
        direction,
        path,
        expected,
        received
    }) {
        const location = path || '$';
        super(`${port}.${method} ${direction} contract violation at ${location}: expected ${expected}, received ${PortContractError.describe(received)}`);
        this.name = 'PortContractError';
        this.port = port;
        this.method = method;
        this.direction = direction;
        this.path = location;
        this.expected = expected;
        this.received = received;
    }

    static describe(value) {
        if (value === null) {
            return 'null';
        }

        if (value === undefined) {
            return 'undefined';
        }

        if (Array.isArray(value)) {
            return 'array';
        }

        if (typeof value === 'object') {
            return 'object';
        }

        if (typeof value === 'string') {
            return `string(${value})`;
        }

        return typeof value;
    }
}

module.exports = {
    PortContractError
};
