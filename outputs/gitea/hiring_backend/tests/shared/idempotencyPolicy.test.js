const { resolveScope, resolveIdempotencyKey } = require('../../src/shared/http/idempotencyPolicy');

describe('shared/http/idempotencyPolicy', () => {
    it('resolves explicit scope when provided', () => {
        const scope = resolveScope({
            req: { method: 'POST', path: '/foo' },
            explicitScope: 'custom.scope'
        });

        expect(scope).toBe('custom.scope');
    });

    it('builds scope from method and route path when explicit scope is not provided', () => {
        const scope = resolveScope({
            req: {
                method: 'PATCH',
                route: { path: '/admin/interviews/:id/cancel' }
            }
        });

        expect(scope).toBe('patch.admin.interviews.id.cancel');
    });

    it('resolves idempotency key from known header candidates', () => {
        const req = {
            get: jest.fn((name) => {
                if (name === 'Idempotency-Key') return '';
                if (name === 'idempotency-key') return '';
                if (name === 'X-Idempotency-Key') return 'abc-123';
                return null;
            })
        };

        expect(resolveIdempotencyKey(req)).toBe('abc-123');
    });
});
