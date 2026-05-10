const { cloneValue, isPlainObject } = require('../../../../src/shared/contracts/runtime/cloneValue');

describe('runtime cloneValue utility', () => {
    it('preserves Date instances when cloning nested DTOs', () => {
        const submittedAt = new Date('2026-04-07T08:18:06.533Z');
        const value = {
            submitted_at: submittedAt,
            nested: {
                last_replied_at: new Date('2026-04-07T08:19:04.996Z')
            }
        };

        const cloned = cloneValue(value);

        expect(cloned).not.toBe(value);
        expect(Object.prototype.toString.call(cloned.submitted_at)).toBe('[object Date]');
        expect(cloned.submitted_at).not.toBe(submittedAt);
        expect(cloned.submitted_at.toISOString()).toBe('2026-04-07T08:18:06.533Z');
        expect(Object.prototype.toString.call(cloned.nested.last_replied_at)).toBe('[object Date]');
        expect(cloned.nested.last_replied_at.toISOString()).toBe('2026-04-07T08:19:04.996Z');
    });

    it('does not treat Date as a plain object', () => {
        expect(isPlainObject({ key: 'value' })).toBe(true);
        expect(isPlainObject(new Date())).toBe(false);
    });

    it('clones circular references via structuredClone when available', () => {
        const value = { id: 'root' };
        value.self = value;

        const cloned = cloneValue(value);

        expect(cloned).not.toBe(value);
        expect(cloned.id).toBe('root');
        expect(cloned.self).toBe(cloned);
    });

    it('throws on function-valued payloads that structuredClone cannot clone', () => {
        const query = jest.fn();
        const value = {
            client: {
                query
            }
        };

        expect(() => cloneValue(value)).toThrow(/could not be cloned|DataCloneError/i);
    });
});
