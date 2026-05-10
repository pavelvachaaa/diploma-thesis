const { createContractPort } = require('@shared/contracts/runtime');
const {
    nonEmptyString,
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
const emailHealthDto = objectShape({}, { allowExtra: true });

module.exports = ({ emailApplication }) => {
    const {
        sendCustomEmail,
        sendTestEmail,
        sendWelcomeEmail,
        getHealthStatus
    } = requireServiceMethods(emailApplication, 'emailApplication', 'EmailSenderPort', [
        'sendCustomEmail',
        'sendTestEmail',
        'sendWelcomeEmail',
        'getHealthStatus'
    ]);

    return createContractPort({
        portName: 'EmailSenderPort',
        methods: {
            sendCustomEmail: {
                input: tuple(plainObject),
                output: emailSendResultDto,
                impl: async (payload) => cloneDto(await sendCustomEmail(cloneDto(payload)))
            },
            sendTestEmail: {
                input: tuple(nonEmptyString('email')),
                output: emailSendResultDto,
                impl: async (email) => cloneDto(await sendTestEmail(email))
            },
            sendWelcomeEmail: {
                input: tuple(plainObject),
                output: emailSendResultDto,
                impl: async (payload) => cloneDto(await sendWelcomeEmail(cloneDto(payload)))
            },
            getHealthStatus: {
                input: tuple(),
                output: emailHealthDto,
                impl: async () => cloneDto(await getHealthStatus())
            }
        }
    });
};
