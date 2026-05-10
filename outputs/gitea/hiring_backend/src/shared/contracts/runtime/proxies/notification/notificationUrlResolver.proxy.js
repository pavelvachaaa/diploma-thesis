const { createContractPort } = require('@shared/contracts/runtime');
const {
    entityId,
    nonEmptyString,
    nullable,
    optional,
    plainObject,
    tuple
} = require('@shared/contracts/runtime/common');
const { cloneDto, requireServiceMethods } = require('@shared/contracts/runtime/portUtils');
const portDefinition = require('@core/notification/application/ports/notificationUrlResolver.port');

module.exports = ({ notificationUrlResolverAdapter }) => {
    const service = requireServiceMethods(
        notificationUrlResolverAdapter,
        'notificationUrlResolverAdapter',
        portDefinition.portName,
        portDefinition.methods
    );

    return createContractPort({
        portName: portDefinition.portName,
        methods: {
            generateNotificationUrl: {
                input: tuple(entityId, nonEmptyString('notification type'), optional(plainObject)),
                output: nullable(nonEmptyString('notification url')),
                impl: (recipientUserId, type, data = {}) => service.generateNotificationUrl(
                    recipientUserId,
                    type,
                    cloneDto(data || {})
                )
            }
        }
    });
};
