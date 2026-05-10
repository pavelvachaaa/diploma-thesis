const fs = require('node:fs');
const path = require('node:path');
const portDefinition = require('../../../../src/core/auth/application/ports/seatLocationOrganizationLookup.port');

describe('SeatLocationOrganizationLookupPort', () => {
    it('exports a pure port manifest without runtime imports', () => {
        const source = fs.readFileSync(path.join(__dirname, '../../../../src/core/auth/application/ports/seatLocationOrganizationLookup.port.js'), 'utf8');

        expect(portDefinition).toEqual({
            portName: 'SeatLocationOrganizationLookupPort',
            methods: [
                'getOrganizationBySeatLocation'
            ]
        });
        expect(source).not.toContain('createContractPort');
        expect(source).not.toContain('@shared/contracts/runtime');
        expect(source).not.toContain('require(');
    });
});
