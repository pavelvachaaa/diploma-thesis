const QualificationLookupRequest = require('../../../../src/core/qualification/domain/QualificationLookupRequest');
const ApplicationError = require('../../../../src/core/shared/errors/ApplicationError');
const { ErrorCode } = require('../../../../src/core/shared/errors/ApplicationError');

describe('QualificationLookupRequest', () => {
    it('validates and normalizes a valid birth-number lookup request', () => {
        const request = QualificationLookupRequest.create({
            searchType: ' rodne_cislo ',
            query: ' 850101 / 1234 ',
            applicantId: ' applicant-1 '
        });

        expect(request).toMatchObject({
            searchType: 'rodne_cislo',
            normalizedQuery: '8501011234',
            queryMasked: '******1234',
            applicantId: 'applicant-1'
        });
        expect(request.queryHash).toEqual(expect.any(String));
        expect(Object.isFrozen(request)).toBe(true);
    });

    it('rejects invalid search type with semantic validation code and reasonCode', () => {
        expect(() => QualificationLookupRequest.create({
            searchType: 'email',
            query: 'x'
        })).toThrow(ApplicationError);

        try {
            QualificationLookupRequest.create({
                searchType: 'email',
                query: 'x'
            });
        } catch (error) {
            expect(error).toMatchObject({
                code: ErrorCode.VALIDATION_ERROR,
                details: {
                    reasonCode: 'QUALIFICATION_INVALID_SEARCH_TYPE'
                }
            });
        }
    });

    it('rejects invalid NRZP format', () => {
        expect(() => QualificationLookupRequest.create({
            searchType: 'nrzp',
            query: '12ab'
        })).toThrow(ApplicationError);

        try {
            QualificationLookupRequest.create({
                searchType: 'nrzp',
                query: '12ab'
            });
        } catch (error) {
            expect(error).toMatchObject({
                code: ErrorCode.VALIDATION_ERROR,
                details: {
                    reasonCode: 'QUALIFICATION_INVALID_NRZP'
                }
            });
        }
    });
});
