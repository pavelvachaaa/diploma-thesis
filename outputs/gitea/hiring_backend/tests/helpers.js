const createMockLogger = () => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    trace: jest.fn(),
    fatal: jest.fn(),
});

const createMockDb = () => {
    const mockClient = {
        query: jest.fn(),
        release: jest.fn(),
    };

    return {
        query: jest.fn(),
        getClient: jest.fn().mockResolvedValue(mockClient),
        _mockClient: mockClient,
    };
};

const createMockReq = (overrides = {}) => ({
    params: {},
    query: {},
    body: {},
    user: {
        id: 'user-uuid-1',
        email: 'test@example.com',
        name: 'Test',
        surname: 'User',
        fullName: 'Test User',
        organization_id: 'org-uuid-1',
        organizations: ['org-uuid-1'],
        roles: ['admin'],
    },
    files: [],
    headers: {},
    get: jest.fn((name) => {
        const headers = overrides.headers || {};
        return headers[name] || headers[String(name).toLowerCase()] || undefined;
    }),
    organizationId: 'org-uuid-1',
    organizationIds: ['org-uuid-1'],
    ...overrides,
});

const createMockRes = () => {
    const res = {
        status: jest.fn(),
        json: jest.fn(),
        send: jest.fn(),
    };
    res.status.mockReturnValue(res);
    return res;
};

module.exports = {
    createMockLogger,
    createMockDb,
    createMockReq,
    createMockRes,
};
