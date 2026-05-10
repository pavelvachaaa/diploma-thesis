const createQualificationAuditProxy = require('../../../../../src/shared/contracts/runtime/proxies/qualification/qualificationAudit.proxy');

describe('qualificationAudit runtime proxy', () => {
    it('delegates audit writes through the adapter contract', async () => {
        const qualificationAuditAdapter = {
            recordLookup: jest.fn().mockResolvedValue(null)
        };
        const proxy = createQualificationAuditProxy({ qualificationAuditAdapter });
        const event = {
            status: 'success',
            searchType: 'nrzp',
            queryMasked: '*****6563'
        };

        await proxy.recordLookup(event);

        expect(qualificationAuditAdapter.recordLookup).toHaveBeenCalledWith(event);
        expect(qualificationAuditAdapter.recordLookup.mock.calls[0][0]).not.toBe(event);
    });
});
