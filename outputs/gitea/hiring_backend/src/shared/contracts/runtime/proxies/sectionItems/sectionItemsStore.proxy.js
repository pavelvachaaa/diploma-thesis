const { createContractPort } = require('@shared/contracts/runtime');
const {
    arrayOf,
    nonEmptyString,
    objectShape,
    optionsObject,
    optional,
    stringArray,
    tuple
} = require('@shared/contracts/runtime/common');
const {
    cloneDtoArray,
    cloneOptions,
    requireServiceMethods
} = require('@shared/contracts/runtime/portUtils');
const portDefinition = require('@core/sectionItems/application/ports/sectionItemsStore.port');

const sectionItemDto = objectShape({}, { allowExtra: true });
const sectionItemArrayDto = arrayOf(sectionItemDto);

module.exports = ({ sectionItemsApplication }) => {
    const service = requireServiceMethods(
        sectionItemsApplication,
        'sectionItemsApplication',
        portDefinition.portName,
        portDefinition.methods
    );

    return createContractPort({
        portName: portDefinition.portName,
        methods: {
            getBySectionType: {
                input: tuple(nonEmptyString('section type name'), optional(optionsObject)),
                output: sectionItemArrayDto,
                impl: async (sectionTypeName, options = {}) => cloneDtoArray(
                    await service.getBySectionType(sectionTypeName, cloneOptions(options))
                )
            },
            ensureCatalogItems: {
                input: tuple(nonEmptyString('section type name'), stringArray, optional(optionsObject)),
                output: sectionItemArrayDto,
                impl: async (sectionTypeName, texts = [], options = {}) => cloneDtoArray(
                    await service.ensureCatalogItems(sectionTypeName, cloneDtoArray(texts), cloneOptions(options))
                )
            }
        }
    });
};
