const { createContractPort } = require('@shared/contracts/runtime');
const { plainObject, objectShape, optional, booleanFlag, nonEmptyString, tuple } = require('@shared/contracts/runtime/common');
const { cloneDto, requireServiceMethods } = require('@shared/contracts/runtime/portUtils');
const portDefinition = require('@core/email/application/ports/emailSenderAccess.port');

module.exports = ({ emailApplication }) => {
    const service = requireServiceMethods(
        emailApplication,
        'emailApplication',
        portDefinition.portName,
        portDefinition.methods
    );

    const emailResultDto = objectShape({ success: optional(booleanFlag()) }, { allowExtra: true });

    return createContractPort({
        portName: portDefinition.portName,
        methods: {
            sendWelcomeEmail: {
                input: tuple(plainObject),
                output: emailResultDto,
                impl: async (payload) => cloneDto(await service.sendWelcomeEmail(cloneDto(payload)))
            },
            sendNotificationEmail: {
                input: tuple(plainObject),
                output: emailResultDto,
                impl: async (payload) => cloneDto(await service.sendNotificationEmail(cloneDto(payload)))
            },
            sendCustomEmail: {
                input: tuple(plainObject),
                output: emailResultDto,
                impl: async (payload) => cloneDto(await service.sendCustomEmail(cloneDto(payload)))
            },
            sendApplicantEmail: {
                input: tuple(plainObject),
                output: emailResultDto,
                impl: async (payload) => cloneDto(await service.sendApplicantEmail(cloneDto(payload)))
            },
            sendInterviewInvitation: {
                input: tuple(plainObject),
                output: emailResultDto,
                impl: async (payload) => cloneDto(await service.sendInterviewInvitation(cloneDto(payload)))
            },
            sendApplicationReceivedEmail: {
                input: tuple(plainObject),
                output: emailResultDto,
                impl: async (payload) => cloneDto(await service.sendApplicationReceivedEmail(cloneDto(payload)))
            },
            sendApplicationUnderReviewEmail: {
                input: tuple(plainObject),
                output: emailResultDto,
                impl: async (payload) => cloneDto(await service.sendApplicationUnderReviewEmail(cloneDto(payload)))
            },
            sendRejectionEmail: {
                input: tuple(plainObject),
                output: emailResultDto,
                impl: async (payload) => cloneDto(await service.sendRejectionEmail(cloneDto(payload)))
            },
            sendTestEmail: {
                input: tuple(nonEmptyString('email')),
                output: emailResultDto,
                impl: async (email) => cloneDto(await service.sendTestEmail(email))
            },
            getHealthStatus: {
                input: tuple(),
                output: objectShape({}, { allowExtra: true }),
                impl: async () => cloneDto(await service.getHealthStatus())
            }
        }
    });
};
