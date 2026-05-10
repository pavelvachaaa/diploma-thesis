const { createContractPort } = require('@shared/contracts/runtime');
const {
    entityId,
    optionsObject,
    plainObject,
    objectShape,
    arrayOf,
    optional,
    tuple
} = require('@shared/contracts/runtime/common');
const {
    cloneDto,
    cloneDtoArray,
    cloneOptions,
    requireServiceMethods
} = require('@shared/contracts/runtime/portUtils');

const auditEventDto = objectShape({}, { allowExtra: true });
const auditPageDto = objectShape({
    data: optional(arrayOf(auditEventDto))
}, { allowExtra: true });

module.exports = ({ operationsAuditApplication }) => {
    const service = requireServiceMethods(
        operationsAuditApplication,
        'operationsAuditApplication',
        'AuditQueryPort',
        ['getEvents', 'getEmployeeEvents']
    );

    return createContractPort({
        portName: 'AuditQueryPort',
        methods: {
            getEvents: {
                input: tuple(optional(optionsObject), optional(plainObject)),
                output: auditPageDto,
                impl: async (filters = {}, actorUser = {}) => {
                    const result = await service.getEvents(cloneOptions(filters), cloneDto(actorUser) || {});
                    return {
                        ...cloneDto(result),
                        data: cloneDtoArray(result?.data)
                    };
                }
            },
            getEmployeeEvents: {
                input: tuple(entityId, optional(optionsObject), optional(plainObject)),
                output: auditPageDto,
                impl: async (employeeId, filters = {}, actorUser = {}) => {
                    const result = await service.getEmployeeEvents(
                        employeeId,
                        cloneOptions(filters),
                        cloneDto(actorUser) || {}
                    );
                    return {
                        ...cloneDto(result),
                        data: cloneDtoArray(result?.data)
                    };
                }
            }
        }
    });
};
