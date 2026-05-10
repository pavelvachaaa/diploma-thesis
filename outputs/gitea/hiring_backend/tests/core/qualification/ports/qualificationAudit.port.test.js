const fs = require('node:fs');
const path = require('node:path');
const portDefinition = require('../../../../src/core/qualification/application/ports/qualificationAudit.port');

describe('QualificationAuditPort', () => {
    it('exports a pure port manifest without runtime imports', () => {
        const source = fs.readFileSync(path.join(__dirname, '../../../../src/core/qualification/application/ports/qualificationAudit.port.js'), 'utf8');

        expect(portDefinition).toEqual({
            portName: 'QualificationAuditPort',
            methods: [
                'recordLookup'
            ]
        });
        expect(source).not.toContain('createContractPort');
        expect(source).not.toContain('@shared/contracts/runtime');
        expect(source).not.toContain('require(');
    });
});
