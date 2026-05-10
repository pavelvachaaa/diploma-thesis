const fs = require('node:fs');
const path = require('node:path');
const portDefinition = require('../../../../src/core/internalUsers/application/ports/internalUserDirectory.port');

describe('InternalUserDirectoryPort', () => {
    it('exports a pure port manifest without runtime imports', () => {
        const source = fs.readFileSync(path.join(__dirname, '../../../../src/core/internalUsers/application/ports/internalUserDirectory.port.js'), 'utf8');

        expect(portDefinition).toEqual({
            portName: 'InternalUserDirectoryPort',
            methods: [
                'searchUsers'
            ]
        });
        expect(source).not.toContain('createContractPort');
        expect(source).not.toContain('@shared/contracts/runtime');
        expect(source).not.toContain('require(');
    });
});
