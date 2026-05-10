const { createContractPort } = require('@shared/contracts/runtime');
const {
    plainObject,
    tuple
} = require('@shared/contracts/runtime/common');
const {
    cloneDto,
    requireServiceMethods
} = require('@shared/contracts/runtime/portUtils');
const portDefinition = require('@core/contactInquiries/application/ports/contactInquiryAudit.port');

module.exports = ({ contactInquiryAuditAdapter }) => {
    const service = requireServiceMethods(
        contactInquiryAuditAdapter,
        'contactInquiryAuditAdapter',
        portDefinition.portName,
        portDefinition.methods
    );

    return createContractPort({
        portName: portDefinition.portName,
        methods: {
            recordInquirySubmitted: {
                input: tuple(plainObject),
                impl: async (event) => service.recordInquirySubmitted(cloneDto(event))
            },
            recordInquiryReplied: {
                input: tuple(plainObject),
                impl: async (event) => service.recordInquiryReplied(cloneDto(event))
            }
        }
    });
};
