const { createContractPort } = require('@shared/contracts/runtime');
const { plainObject, tuple } = require('@shared/contracts/runtime/common');
const { cloneDto, requireServiceMethods } = require('@shared/contracts/runtime/portUtils');
const portDefinition = require('@core/auth/application/ports/authAudit.port');

module.exports = ({ authAuditAdapter }) => {
    const service = requireServiceMethods(
        authAuditAdapter,
        'authAuditAdapter',
        portDefinition.portName,
        portDefinition.methods
    );

    return createContractPort({
        portName: portDefinition.portName,
        methods: {
            emitAuthEvent: {
                input: tuple(plainObject),
                impl: (event) => service.emitAuthEvent(cloneDto(event))
            }
        }
    });
};
