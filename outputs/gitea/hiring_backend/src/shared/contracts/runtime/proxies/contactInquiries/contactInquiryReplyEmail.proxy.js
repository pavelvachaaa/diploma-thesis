const { createContractPort } = require('@shared/contracts/runtime');
const {
    booleanFlag,
    objectShape,
    optional,
    plainObject,
    tuple
} = require('@shared/contracts/runtime/common');
const {
    cloneDto,
    requireServiceMethods
} = require('@shared/contracts/runtime/portUtils');
const portDefinition = require('@core/contactInquiries/application/ports/contactInquiryReplyEmail.port');

const emailSendResultDto = objectShape({
    success: optional(booleanFlag())
}, { allowExtra: true });

module.exports = ({ contactInquiryReplyEmailAdapter }) => {
    const service = requireServiceMethods(
        contactInquiryReplyEmailAdapter,
        'contactInquiryReplyEmailAdapter',
        portDefinition.portName,
        portDefinition.methods
    );

    return createContractPort({
        portName: portDefinition.portName,
        methods: {
            sendReplyEmail: {
                input: tuple(plainObject),
                output: emailSendResultDto,
                impl: async (payload) => cloneDto(await service.sendReplyEmail(cloneDto(payload)))
            }
        }
    });
};
