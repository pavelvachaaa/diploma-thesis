module.exports = (container, portTokens) => {
    if (!Array.isArray(portTokens)) {
        throw new Error('Port contract token list is required');
    }

    const failures = [];

    for (const token of portTokens) {
        try {
            container.resolve(token);
        } catch (error) {
            failures.push(`${token}: ${error.message}`);
        }
    }

    if (failures.length > 0) {
        throw new Error([
            'Port contract warm-up failed:',
            ...failures.map((failure) => ` - ${failure}`)
        ].join('\n'));
    }
};
