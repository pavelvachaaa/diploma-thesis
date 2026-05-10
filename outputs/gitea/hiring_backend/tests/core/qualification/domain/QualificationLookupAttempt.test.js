const QualificationLookupAttempt = require('../../../../src/core/qualification/domain/QualificationLookupAttempt');

describe('QualificationLookupAttempt', () => {
    it('normalizes raw payload for audit-safe failure handling', () => {
        const result = QualificationLookupAttempt.create({
            searchType: ' rodne_cislo ',
            query: ' 850101 / 1234 ',
            applicantId: ' applicant-1 ',
            actor: {
                id: ' user-1 ',
                email: ' user@example.com ',
                roles: [' hr ', '', 'admin'],
                organizationId: ' org-1 '
            }
        });

        expect(result).toMatchObject({
            searchType: 'rodne_cislo',
            normalizedQuery: '8501011234',
            queryMasked: '******1234',
            applicantId: 'applicant-1',
            actor: {
                id: 'user-1',
                email: 'user@example.com',
                roles: ['hr', 'admin'],
                organizationId: 'org-1'
            }
        });
        expect(result.queryHash).toEqual(expect.any(String));
        expect(Object.isFrozen(result)).toBe(true);
        expect(Object.isFrozen(result.actor)).toBe(true);
        expect(Object.isFrozen(result.actor.roles)).toBe(true);
    });

    it('defaults unknown search types to nrzp normalization without throwing', () => {
        const result = QualificationLookupAttempt.create({
            searchType: 'email',
            query: ' 12 34 '
        });

        expect(result.searchType).toBe('email');
        expect(result.normalizedQuery).toBe('1234');
        expect(result.queryMasked).toBe('****');
    });
});
