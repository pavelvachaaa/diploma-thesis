const { createContractPort } = require('@shared/contracts/runtime');
const {
    plainObject,
    objectShape,
    optional,
    booleanFlag,
    tuple
} = require('@shared/contracts/runtime/common');
const { cloneDto, requireServiceMethods } = require('@shared/contracts/runtime/portUtils');

const emailSendResultDto = objectShape({
    success: optional(booleanFlag())
}, { allowExtra: true });

module.exports = ({ emailApplication }) => {
    const {
        sendApplicantEmail,
        sendInterviewInvitation
    } = requireServiceMethods(emailApplication, 'emailApplication', 'ApplicantEmailPort', [
        'sendApplicantEmail',
        'sendInterviewInvitation'
    ]);

    return createContractPort({
        portName: 'ApplicantEmailPort',
        methods: {
            sendApplicantEmail: {
                input: tuple(plainObject),
                output: emailSendResultDto,
                impl: async (payload) => cloneDto(await sendApplicantEmail(cloneDto(payload)))
            },
            sendInterviewInvitation: {
                input: tuple(plainObject),
                output: emailSendResultDto,
                impl: async (payload) => cloneDto(await sendInterviewInvitation(cloneDto(payload)))
            }
        }
    });
};
