describe('container explicit registry', () => {
    beforeEach(() => {
        jest.resetModules();
    });

    it('resolves all explicitly registered non-domain and route tokens', () => {
        // eslint-disable-next-line global-require
        const container = require('../../src/container');
        // eslint-disable-next-line global-require
        const registry = require('../../src/container.registry');

        const domainTokens = [];
        for (const modulePath of registry.domainModules) {
            // eslint-disable-next-line global-require, import/no-dynamic-require
            const moduleDefinition = require(modulePath);
            domainTokens.push(...Object.keys(moduleDefinition.registrations || {}));
        }

        const tokens = new Set([
            ...Object.keys(registry.infrastructure || {}),
            ...Object.keys(registry.outboundAdapters || {}),
            ...Object.keys(registry.services || {}),
            ...Object.keys(registry.controllers || {}),
            ...Object.keys(registry.routes || {}),
            ...domainTokens
        ]);

        for (const token of tokens) {
            expect(() => container.resolve(token)).not.toThrow();
        }
    });
});
