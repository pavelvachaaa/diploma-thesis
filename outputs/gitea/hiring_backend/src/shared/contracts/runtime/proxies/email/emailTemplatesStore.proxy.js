const { createContractPort } = require('@shared/contracts/runtime');
const { plainObject, objectShape, optional, tuple } = require('@shared/contracts/runtime/common');
const { cloneDto, requireServiceMethods } = require('@shared/contracts/runtime/portUtils');
const portDefinition = require('@core/email/application/ports/emailTemplatesStore.port');

module.exports = ({ emailTemplatesStoreAdapter }) => {
    const service = requireServiceMethods(
        emailTemplatesStoreAdapter,
        'emailTemplatesStoreAdapter',
        portDefinition.portName,
        portDefinition.methods
    );

    const templateDto = objectShape({}, { allowExtra: true });
    const optionalTemplate = optional(templateDto);

    return createContractPort({
        portName: portDefinition.portName,
        methods: {
            getAll: {
                input: tuple(optional(plainObject), optional(plainObject)),
                output: objectShape({}, { allowExtra: true }),
                impl: async (query, options) => {
                    const rows = await service.getAll(cloneDto(query || {}), cloneDto(options || {}));
                    return Array.isArray(rows) ? rows.map(cloneDto) : rows;
                }
            },
            getById: {
                input: tuple(plainObject, optional(plainObject)),
                output: optionalTemplate,
                impl: async (id, options) => cloneDto(await service.getById(id, cloneDto(options || {})))
            },
            create: {
                input: tuple(plainObject, optional(plainObject)),
                output: optionalTemplate,
                impl: async (data, options) => cloneDto(await service.create(cloneDto(data), cloneDto(options || {})))
            },
            update: {
                input: tuple(plainObject, plainObject, optional(plainObject)),
                output: optionalTemplate,
                impl: async (id, data, options) => cloneDto(await service.update(id, cloneDto(data), cloneDto(options || {})))
            },
            remove: {
                input: tuple(plainObject, optional(plainObject)),
                output: optionalTemplate,
                impl: async (id, options) => cloneDto(await service.remove(id, cloneDto(options || {})))
            }
        }
    });
};
