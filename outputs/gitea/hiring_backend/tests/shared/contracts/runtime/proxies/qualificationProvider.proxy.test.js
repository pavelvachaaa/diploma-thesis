const createQualificationProviderProxy = require('../../../../../src/shared/contracts/runtime/proxies/qualification/qualificationProvider.proxy');

describe('qualificationProvider runtime proxy', () => {
    it('delegates lookup calls through the provider adapter contract', async () => {
        const qualificationProviderAdapter = {
            lookupByWorkerNumber: jest.fn().mockResolvedValue({
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
            }),
            lookupByBirthNumber: jest.fn().mockResolvedValue({
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
            })
        };
        const proxy = createQualificationProviderProxy({ qualificationProviderAdapter });

        await proxy.lookupByWorkerNumber({ workerNumber: '122036563' });
        await proxy.lookupByBirthNumber({ birthNumber: '8501011234' });

        expect(qualificationProviderAdapter.lookupByWorkerNumber).toHaveBeenCalledWith({
            workerNumber: '122036563'
        });
        expect(qualificationProviderAdapter.lookupByBirthNumber).toHaveBeenCalledWith({
            birthNumber: '8501011234'
        });
    });
});
