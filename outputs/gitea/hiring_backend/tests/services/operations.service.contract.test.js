const createAuditApplication = require('../../src/core/operations/application/audit');
const createOutboxApplication = require('../../src/core/operations/application/outbox');

describe('operations service API contracts', () => {
    it('exposes audit application API surface', () => {
        const application = createAuditApplication({
            operationsAuditStorePort: {}
        });

        expect(Object.keys(application).sort()).toEqual([
            'getEmployeeEvents',
            'getEvents'
        ]);
    });

    it('exposes outbox application API surface', () => {
        const application = createOutboxApplication({
            operationsOutboxGatewayPort: {},
            operationsOutboxAlertConfigPort: {}
        });

        expect(Object.keys(application).sort()).toEqual([
            'getEvents',
            'getSummary',
            'replayDead'
        ]);
    });
});
