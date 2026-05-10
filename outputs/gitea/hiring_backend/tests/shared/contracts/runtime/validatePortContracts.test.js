describe('validatePortContracts', () => {
    beforeEach(() => {
        jest.resetModules();
    });

    it('aggregates warm-up failures across resolved port tokens', () => {
        // eslint-disable-next-line global-require
        const validatePortContracts = require('../../../../src/shared/contracts/runtime/validatePortContracts');
        const container = {
            resolve: jest.fn((token) => {
                if (token === 'betaPort') {
                    throw new Error('missing impl');
                }

                return { token };
            })
        };

        expect(() => validatePortContracts(container, ['alphaPort', 'betaPort'])).toThrow([
            'Port contract warm-up failed:',
            ' - betaPort: missing impl'
        ].join('\n'));
        expect(container.resolve).toHaveBeenCalledWith('alphaPort');
        expect(container.resolve).toHaveBeenCalledWith('betaPort');
    });

    it('requires callers to pass discovered port tokens explicitly', () => {
        // eslint-disable-next-line global-require
        const validatePortContracts = require('../../../../src/shared/contracts/runtime/validatePortContracts');

        expect(() => validatePortContracts({ resolve: jest.fn() })).toThrow('Port contract token list is required');
    });
});
