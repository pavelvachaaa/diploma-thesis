const { createContractPort } = require('@shared/contracts/runtime');
const {
    plainObject,
    tuple
} = require('@shared/contracts/runtime/common');
const {
    cloneDto,
    requireServiceMethods
} = require('@shared/contracts/runtime/portUtils');
const portDefinition = require('@core/qualification/application/ports/qualificationAudit.port');

module.exports = ({ qualificationAuditAdapter }) => {
    const service = requireServiceMethods(
        qualificationAuditAdapter,
        'qualificationAuditAdapter',
        portDefinition.portName,
        portDefinition.methods
    );

    return createContractPort({
        portName: portDefinition.portName,
        methods: {
            recordLookup: {
                input: tuple(plainObject),
                impl: async (event) => service.recordLookup(cloneDto(event))
            }
        }
    });
};
