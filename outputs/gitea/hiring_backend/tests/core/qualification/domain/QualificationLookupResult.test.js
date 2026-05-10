const QualificationLookupResult = require('../../../../src/core/qualification/domain/QualificationLookupResult');

describe('QualificationLookupResult', () => {
    it('builds a frozen success response and derives counts from normalized provider data', () => {
        const result = QualificationLookupResult.create({
            request: {
                searchType: 'nrzp',
                queryMasked: '*****6563',
                applicantId: 'applicant-1'
            },
            providerResult: {
                worker: {
                    nrzpCislo: '122036563',
                    jmeno: 'Jan',
                    prijmeni: 'Váchal'
                },
                workers: [
                    {
                        nrzpCislo: '122036563',
                        jmeno: 'Jan',
                        prijmeni: 'Váchal'
                    }
                ],
                qualifications: {
                    odborneZpusobilosti: [{ nrzpCislo: '122036563', obor: 'A' }],
                    specializovaneZpusobilosti: [],
                    zvlastniOdborneZpusobilosti: [{ nrzpCislo: '122036563', obor: 'B' }]
                },
                counts: {},
                upstream: {
                    status: 1,
                    success: 1
                }
            }
        });

        expect(result).toEqual({
            searchType: 'nrzp',
            queryMasked: '*****6563',
            applicantId: 'applicant-1',
            worker: {
                nrzpCislo: '122036563',
                jmeno: 'Jan',
                prijmeni: 'Váchal',
                datumNarozeni: null,
                statniObcanstvi: null
            },
            workers: [{
                nrzpCislo: '122036563',
                jmeno: 'Jan',
                prijmeni: 'Váchal',
                datumNarozeni: null,
                statniObcanstvi: null
            }],
            qualifications: {
                odborneZpusobilosti: [{
                    nrzpCislo: '122036563',
                    typZpusobilosti: null,
                    obor: 'A',
                    odbornost: null
                }],
                specializovaneZpusobilosti: [],
                zvlastniOdborneZpusobilosti: [{
                    nrzpCislo: '122036563',
                    typZpusobilosti: null,
                    obor: 'B',
                    odbornost: null
                }]
            },
            counts: {
                workers: 1,
                odborneZpusobilosti: 1,
                specializovaneZpusobilosti: 0,
                zvlastniOdborneZpusobilosti: 1
            },
            upstream: {
                status: 1,
                success: 1,
                stav: null,
                message: null,
                error: null,
                operation: null
            }
        });
        expect(Object.isFrozen(result)).toBe(true);
        expect(Object.isFrozen(result.qualifications)).toBe(true);
        expect(Object.isFrozen(result.workers)).toBe(true);
    });
});
