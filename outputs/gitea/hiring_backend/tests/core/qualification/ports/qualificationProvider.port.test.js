const fs = require('node:fs');
const path = require('node:path');
const portDefinition = require('../../../../src/core/qualification/application/ports/qualificationProvider.port');

describe('QualificationProviderPort', () => {
    it('exports a pure port manifest without runtime imports', () => {
        const source = fs.readFileSync(path.join(__dirname, '../../../../src/core/qualification/application/ports/qualificationProvider.port.js'), 'utf8');

        expect(portDefinition).toEqual({
            portName: 'QualificationProviderPort',
            methods: [
                'lookupByWorkerNumber',
                'lookupByBirthNumber'
            ]
        });
        expect(source).not.toContain('createContractPort');
        expect(source).not.toContain('@shared/contracts/runtime');
        expect(source).not.toContain('require(');
    });
});
