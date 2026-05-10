const fs = require('node:fs');
const path = require('node:path');
const portDefinition = require('../../../../src/domain/jobs/ports/internalUserProvisioning.port');

describe('InternalUserProvisioningPort', () => {
    it('exports a pure port manifest without runtime imports', () => {
        const source = fs.readFileSync(path.join(__dirname, '../../../../src/domain/jobs/ports/internalUserProvisioning.port.js'), 'utf8');

        expect(portDefinition).toEqual({
            portName: 'InternalUserProvisioningPort',
            methods: [
                'ensureLocalUser'
            ]
        });
        expect(source).not.toContain('createContractPort');
        expect(source).not.toContain('@shared/contracts/runtime');
        expect(source).not.toContain('require(');
    });
});
