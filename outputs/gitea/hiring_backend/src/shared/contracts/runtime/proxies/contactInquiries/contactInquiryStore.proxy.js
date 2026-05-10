const { createContractPort } = require('@shared/contracts/runtime');
const {
    arrayOf,
    entityId,
    nullable,
    objectShape,
    optionsObject,
    optional,
    plainObject,
    tuple
} = require('@shared/contracts/runtime/common');
const {
    cloneDto,
    cloneDtoArray,
    cloneOptions,
    requireServiceMethods
} = require('@shared/contracts/runtime/portUtils');
const portDefinition = require('@core/contactInquiries/application/ports/contactInquiryStore.port');

const inquiryDto = nullable(objectShape({}, { allowExtra: true }));
const inquiryListDto = objectShape({
    data: arrayOf(objectShape({}, { allowExtra: true })),
    pagination: objectShape({}, { allowExtra: true })
}, { allowExtra: true });

module.exports = ({ contactInquiryStoreAdapter }) => {
    const service = requireServiceMethods(
        contactInquiryStoreAdapter,
        'contactInquiryStoreAdapter',
        portDefinition.portName,
        portDefinition.methods
    );

    return createContractPort({
        portName: portDefinition.portName,
        methods: {
            createInquiry: {
                input: tuple(plainObject, optional(optionsObject)),
                output: inquiryDto,
                impl: async (data, options = {}) => {
                    const result = await service.createInquiry(cloneDto(data), cloneOptions(options));
                    return result ? cloneDto(result) : null;
                }
            },
            getAllInquiries: {
                input: tuple(optional(plainObject), optional(optionsObject)),
                output: inquiryListDto,
                impl: async (filters = {}, options = {}) => {
                    const result = await service.getAllInquiries(cloneDto(filters || {}), cloneOptions(options));
                    const clonedResult = cloneDto(result);

                    if (!clonedResult) {
                        return clonedResult;
                    }

                    return {
                        ...clonedResult,
                        data: cloneDtoArray(clonedResult.data),
                        pagination: cloneDto(clonedResult.pagination)
                    };
                }
            },
            getInquiryById: {
                input: tuple(entityId, optional(optionsObject)),
                output: inquiryDto,
                impl: async (id, options = {}) => {
                    const result = await service.getInquiryById(id, cloneOptions(options));
                    return result ? cloneDto(result) : null;
                }
            },
            markInquiryReplied: {
                input: tuple(entityId, plainObject, optional(optionsObject)),
                output: inquiryDto,
                impl: async (id, replyMeta, options = {}) => {
                    const result = await service.markInquiryReplied(id, cloneDto(replyMeta), cloneOptions(options));
                    return result ? cloneDto(result) : null;
                }
            }
        }
    });
};
