const createAiJobChatApplication = require('../../src/core/ai/application');

describe('ai service API contracts', () => {
    it('exposes expected aiJobChat application API surface', () => {
        const application = createAiJobChatApplication({
            aiJobChatGatewayPort: {
                streamChat: jest.fn(),
                refineText: jest.fn(),
                extractJob: jest.fn()
            }
        });

        expect(Object.keys(application).sort()).toEqual([
            'VALID_FIELD_TYPES',
            'extractJob',
            'refineText',
            'streamChat'
        ]);
    });
});
