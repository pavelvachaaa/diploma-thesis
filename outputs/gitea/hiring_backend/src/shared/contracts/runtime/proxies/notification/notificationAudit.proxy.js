const { createContractPort } = require('@shared/contracts/runtime');
const { plainObject, tuple } = require('@shared/contracts/runtime/common');
const { cloneDto, requireServiceMethods } = require('@shared/contracts/runtime/portUtils');
const portDefinition = require('@core/notification/application/ports/notificationAudit.port');

module.exports = ({ notificationAuditAdapter }) => {
    const service = requireServiceMethods(
        notificationAuditAdapter,
        'notificationAuditAdapter',
        portDefinition.portName,
        portDefinition.methods
    );

    return createContractPort({
        portName: portDefinition.portName,
        methods: {
            recordUserNotificationCreated: {
                input: tuple(plainObject),
                impl: (event) => service.recordUserNotificationCreated(cloneDto(event))
            },
            recordRoleBroadcastSent: {
                input: tuple(plainObject),
                impl: (event) => service.recordRoleBroadcastSent(cloneDto(event))
            },
            recordPreferencesUpdated: {
                input: tuple(plainObject),
                impl: (event) => service.recordPreferencesUpdated(cloneDto(event))
            },
            recordTypePreferencesUpdated: {
                input: tuple(plainObject),
                impl: (event) => service.recordTypePreferencesUpdated(cloneDto(event))
            },
            recordAllNotificationsRead: {
                input: tuple(plainObject),
                impl: (event) => service.recordAllNotificationsRead(cloneDto(event))
            }
        }
    });
};
