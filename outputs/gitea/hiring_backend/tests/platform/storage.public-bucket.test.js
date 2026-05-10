const createStorage = require('@platform/storage');

const createLogger = () => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    trace: jest.fn(),
    fatal: jest.fn()
});

describe('platform/storage public organization photo bucket', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    it('ensures the public organization photo bucket exists and applies a public-read policy', async () => {
        const logger = createLogger();
        const storage = createStorage({ logger });
        storage.client = { send: jest.fn().mockResolvedValue({}) };
        storage.init = jest.fn();

        await storage.ensureBuckets();

        const calls = storage.client.send.mock.calls.map(([command]) => command);
        const headBucketCalls = calls.filter((command) => command.constructor.name === 'HeadBucketCommand');
        const bucketPolicyCall = calls.find((command) => command.constructor.name === 'PutBucketPolicyCommand');

        expect(headBucketCalls).toEqual(expect.arrayContaining([
            expect.objectContaining({
                input: expect.objectContaining({
                    Bucket: 'public-organization-photos'
                })
            })
        ]));
        expect(bucketPolicyCall).toBeDefined();
        expect(bucketPolicyCall.input.Bucket).toBe('public-organization-photos');
        expect(JSON.parse(bucketPolicyCall.input.Policy)).toEqual({
            Version: '2012-10-17',
            Statement: [
                {
                    Sid: 'PublicReadGetObject',
                    Effect: 'Allow',
                    Principal: '*',
                    Action: 's3:GetObject',
                    Resource: 'arn:aws:s3:::public-organization-photos/*'
                }
            ]
        });
    });

    it('passes Cache-Control metadata through on upload', async () => {
        const logger = createLogger();
        const storage = createStorage({ logger });
        storage.client = { send: jest.fn().mockResolvedValue({}) };
        storage.init = jest.fn();

        await storage.upload('public-organization-photos', 'organization-contact-photos/org-1.png', Buffer.from('png'), {
            contentType: 'image/png',
            cacheControl: 'public, max-age=31536000, immutable',
            custom: {
                context: 'organization-contact-photos'
            }
        });

        const command = storage.client.send.mock.calls[0][0];
        expect(command.input.CacheControl).toBe('public, max-age=31536000, immutable');
        expect(command.input.ContentType).toBe('image/png');
    });
});
