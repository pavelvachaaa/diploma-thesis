const fs = require('node:fs');
const path = require('node:path');
const portDefinition = require('../../../../src/core/contactInquiries/application/ports/contactInquiryReplyEmail.port');

describe('ContactInquiryReplyEmailPort', () => {
    it('exports a pure port manifest without runtime imports', () => {
        const source = fs.readFileSync(path.join(__dirname, '../../../../src/core/contactInquiries/application/ports/contactInquiryReplyEmail.port.js'), 'utf8');

        expect(portDefinition).toEqual({
            portName: 'ContactInquiryReplyEmailPort',
            methods: [
                'sendReplyEmail'
            ]
        });
        expect(source).not.toContain('createContractPort');
        expect(source).not.toContain('@shared/contracts/runtime');
        expect(source).not.toContain('require(');
    });
});
