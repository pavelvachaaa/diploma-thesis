const { createContractPort } = require('@shared/contracts/runtime');
const {
    objectShape,
    plainObject,
    tuple
} = require('@shared/contracts/runtime/common');
const { cloneDto, requireServiceMethods } = require('@shared/contracts/runtime/portUtils');
const portDefinition = require('@core/notification/application/ports/notificationEmailSender.port');

module.exports = ({ notificationEmailSenderAdapter }) => {
    const service = requireServiceMethods(
        notificationEmailSenderAdapter,
        'notificationEmailSenderAdapter',
        portDefinition.portName,
        portDefinition.methods
    );

    return createContractPort({
        portName: portDefinition.portName,
        methods: {
            sendNotificationEmail: {
                input: tuple(plainObject),
                output: objectShape({}, { allowExtra: true }),
                impl: async (payload) => cloneDto(
                    await service.sendNotificationEmail(cloneDto(payload))
                )
            }
        }
    });
};
