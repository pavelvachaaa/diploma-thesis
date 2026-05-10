const { createContractPort } = require('@shared/contracts/runtime');
const {
    entityId,
    nonEmptyString,
    plainObject,
    nullable,
    objectShape,
    optional,
    tuple
} = require('@shared/contracts/runtime/common');
const { requireServiceMethods } = require('@shared/contracts/runtime/portUtils');

const notificationUrlDto = objectShape({
    url: nullable(nonEmptyString('url'))
}, { allowExtra: true });

module.exports = ({ notificationService }) => {
    const { generateNotificationUrlForUser } = requireServiceMethods(
        notificationService,
        'notificationService',
        'NotificationUrlPort',
        ['generateNotificationUrlForUser']
    );

    return createContractPort({
        portName: 'NotificationUrlPort',
        methods: {
            generateNotificationUrlForUser: {
                input: tuple(entityId, nonEmptyString('notification type'), optional(plainObject)),
                output: notificationUrlDto,
                impl: async (userId, notificationType, metadata = {}) => {
                    const url = await generateNotificationUrlForUser(userId, notificationType, { ...metadata });
                    return {
                        url: url || null
                    };
                }
            }
        }
    });
};
