const fs = require('node:fs');
const path = require('node:path');
const portDefinition = require('../../../../src/core/internalUsers/application/ports/internalUsersStore.port');

describe('InternalUsersStorePort', () => {
    it('exports a pure port manifest without runtime imports', () => {
        const source = fs.readFileSync(path.join(__dirname, '../../../../src/core/internalUsers/application/ports/internalUsersStore.port.js'), 'utf8');

        expect(portDefinition).toEqual({
            portName: 'InternalUsersStorePort',
            methods: [
                'findLocalUserByEmail',
                'findLocalUsersByEmails',
                'getOrganizationBySeatLocation',
                'getOrganizationsBySeatLocations',
                'createLocalInternalUser',
                'updateLocalUserProfile'
            ]
        });
        expect(source).not.toContain('createContractPort');
        expect(source).not.toContain('@shared/contracts/runtime');
        expect(source).not.toContain('require(');
    });
});
