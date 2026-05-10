const fs = require('node:fs');
const path = require('node:path');
const portDefinition = require('../../../../src/core/contactInquiries/application/ports/contactInquiryAudit.port');

describe('ContactInquiryAuditPort', () => {
    it('exports a pure port manifest without runtime imports', () => {
        const source = fs.readFileSync(path.join(__dirname, '../../../../src/core/contactInquiries/application/ports/contactInquiryAudit.port.js'), 'utf8');

        expect(portDefinition).toEqual({
            portName: 'ContactInquiryAuditPort',
            methods: [
                'recordInquirySubmitted',
                'recordInquiryReplied'
            ]
        });
        expect(source).not.toContain('createContractPort');
        expect(source).not.toContain('@shared/contracts/runtime');
        expect(source).not.toContain('require(');
    });
});
