const createQualificationApplication = require('../../src/core/qualification/application');
const ApplicationError = require('../../src/core/shared/errors/ApplicationError');
const { ErrorCode } = require('../../src/core/shared/errors/ApplicationError');

const createMocks = () => ({
    qualificationProviderPort: {
        lookupByWorkerNumber: jest.fn(),
        lookupByBirthNumber: jest.fn()
    },
    qualificationAuditPort: {
        recordLookup: jest.fn().mockResolvedValue(null)
    }
});

describe('qualification application', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('looks up NRZP by worker number and emits success audit', async () => {
        const mocks = createMocks();
        const application = createQualificationApplication(mocks);

        mocks.qualificationProviderPort.lookupByWorkerNumber.mockResolvedValue({
            worker: { nrzpCislo: '122036563' },
            workers: [],
            qualifications: {
                odborneZpusobilosti: [],
                specializovaneZpusobilosti: [],
                zvlastniOdborneZpusobilosti: []
            },
            counts: {
                workers: 0,
                odborneZpusobilosti: 0,
                specializovaneZpusobilosti: 0,
                zvlastniOdborneZpusobilosti: 0
            },
            upstream: { status: 1, success: 1 }
        });

        const result = await application.lookupQualification({
            searchType: 'nrzp',
            query: ' 122036563 ',
            applicantId: 'applicant-1',
            actor: {
                id: 'user-1',
                email: 'user@example.com',
                roles: ['hr'],
                organizationId: 'org-1'
            }
        });

        expect(mocks.qualificationProviderPort.lookupByWorkerNumber).toHaveBeenCalledWith({
            workerNumber: '122036563'
        });
        expect(result.searchType).toBe('nrzp');
        expect(result.queryMasked).toBe('*****6563');
        expect(mocks.qualificationAuditPort.recordLookup).toHaveBeenCalledWith(expect.objectContaining({
            status: 'success',
            searchType: 'nrzp',
            applicantId: 'applicant-1',
            outcomeCode: 'QUALIFICATION_LOOKUP_SUCCESS'
        }));
    });

    it('looks up by birth number and normalizes spaces and slash', async () => {
        const mocks = createMocks();
        const application = createQualificationApplication(mocks);

        mocks.qualificationProviderPort.lookupByBirthNumber.mockResolvedValue({
            worker: null,
            workers: [],
            qualifications: {
                odborneZpusobilosti: [],
                specializovaneZpusobilosti: [],
                zvlastniOdborneZpusobilosti: []
            },
            counts: {
                workers: 0,
                odborneZpusobilosti: 0,
                specializovaneZpusobilosti: 0,
                zvlastniOdborneZpusobilosti: 0
            },
            upstream: { status: 1, success: 1 }
        });

        await application.lookupQualification({
            searchType: 'rodne_cislo',
            query: ' 850101 / 1234 '
        });

        expect(mocks.qualificationProviderPort.lookupByBirthNumber).toHaveBeenCalledWith({
            birthNumber: '8501011234'
        });
    });

    it('rejects invalid search type with ApplicationError VALIDATION_ERROR', async () => {
        const mocks = createMocks();
        const application = createQualificationApplication(mocks);

        await expect(application.lookupQualification({
            searchType: 'email',
            query: 'x'
        })).rejects.toMatchObject({
            name: 'ApplicationError',
            code: ErrorCode.VALIDATION_ERROR,
            details: {
                reasonCode: 'QUALIFICATION_INVALID_SEARCH_TYPE'
            }
        });
    });

    it('rejects invalid birth number format', async () => {
        const mocks = createMocks();
        const application = createQualificationApplication(mocks);

        let thrown;
        try {
            await application.lookupQualification({
                searchType: 'rodne_cislo',
                query: 'abc'
            });
        } catch (error) {
            thrown = error;
        }

        expect(thrown).toBeInstanceOf(ApplicationError);
        expect(thrown).toMatchObject({
            code: ErrorCode.VALIDATION_ERROR,
            details: {
                reasonCode: 'QUALIFICATION_INVALID_BIRTH_NUMBER'
            }
        });

        expect(mocks.qualificationAuditPort.recordLookup).toHaveBeenCalledWith(expect.objectContaining({
            status: 'failure',
            outcomeCode: 'QUALIFICATION_INVALID_BIRTH_NUMBER'
        }));
    });

    it('emits failure audit with masked and hashed query without raw value', async () => {
        const mocks = createMocks();
        const application = createQualificationApplication(mocks);

        const upstreamError = new Error('Qualification provider is unavailable');
        upstreamError.status = 502;
        upstreamError.code = 'QUALIFICATION_PROVIDER_UNAVAILABLE';
        mocks.qualificationProviderPort.lookupByBirthNumber.mockRejectedValue(upstreamError);

        await expect(application.lookupQualification({
            searchType: 'rodne_cislo',
            query: '850101/1234'
        })).rejects.toMatchObject({
            code: 'QUALIFICATION_PROVIDER_UNAVAILABLE'
        });

        const failureCall = mocks.qualificationAuditPort.recordLookup.mock.calls.find(
            ([payload]) => payload.status === 'failure'
        );

        expect(failureCall).toBeTruthy();
        expect(failureCall[0].queryMasked).toBe('******1234');
        expect(failureCall[0].queryHash).toEqual(expect.any(String));
        expect(JSON.stringify(failureCall[0])).not.toContain('850101/1234');
    });
});
