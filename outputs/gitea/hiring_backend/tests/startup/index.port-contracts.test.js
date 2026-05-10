describe('startup port contract warm-up', () => {
    afterEach(() => {
        jest.resetModules();
        jest.clearAllMocks();
    });

    it('fails before app creation and server start when port validation fails', () => {
        const createApp = jest.fn();
        const startServer = jest.fn();
        const validatePortContracts = jest.fn(() => {
            throw new Error('Port contract warm-up failed');
        });
        const container = {
            resolve: jest.fn((token) => {
                if (token === 'db') {
                    return { query: jest.fn() };
                }

                return {};
            })
        };

        jest.doMock('@/container', () => container);
        jest.doMock('@/container.registry', () => ({
            infrastructure: {
                betaPort: {},
                logger: {},
                alphaPort: {}
            }
        }));
        jest.doMock('@platform/logger', () => ({
            fatal: jest.fn(),
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
            debug: jest.fn(),
            trace: jest.fn()
        }));
        jest.doMock('@shared/contracts/runtime', () => ({
            validatePortContracts
        }));
        jest.doMock('@/app', () => ({
            createApp
        }));
        jest.doMock('@/startup/server', () => ({
            startServer
        }));

        expect(() => require('../../src/index')).toThrow('Port contract warm-up failed');
        expect(validatePortContracts).toHaveBeenCalledTimes(1);
        expect(validatePortContracts).toHaveBeenCalledWith(container, ['alphaPort', 'betaPort']);
        expect(createApp).not.toHaveBeenCalled();
        expect(startServer).not.toHaveBeenCalled();
    });
});
