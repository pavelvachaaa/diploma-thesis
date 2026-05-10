const { createContractPort } = require('@shared/contracts/runtime');
const {
    arrayOf,
    nullable,
    nonEmptyString,
    numberRange,
    objectShape,
    tuple
} = require('@shared/contracts/runtime/common');
const {
    cloneDto,
    cloneDtoArray,
    requireServiceMethods
} = require('@shared/contracts/runtime/portUtils');
const portDefinition = require('@core/mzcrAccreditations/application/ports/mzcrAccreditationSource.port');

const plainObject = objectShape({}, { allowExtra: true });

module.exports = ({ mzcrAccreditationSourceAdapter }) => {
    const service = requireServiceMethods(
        mzcrAccreditationSourceAdapter,
        'mzcrAccreditationSourceAdapter',
        portDefinition.portName,
        portDefinition.methods
    );

    return createContractPort({
        portName: portDefinition.portName,
        methods: {
            fetchCatalog: {
                input: tuple(objectShape({
                    catalog: nonEmptyString('catalog')
                })),
                output: arrayOf(plainObject),
                impl: async ({ catalog }) => cloneDtoArray(await service.fetchCatalog({ catalog }))
            },
            fetchAccreditations: {
                input: tuple(objectShape({
                    category: nonEmptyString('category'),
                    targetIco: nonEmptyString('target ICO')
                })),
                output: arrayOf(plainObject),
                impl: async ({ category, targetIco }) => cloneDtoArray(
                    await service.fetchAccreditations({ category, targetIco })
                )
            },
            fetchWorkplace: {
                input: tuple(objectShape({
                    workplaceId: numberRange({ min: 1 })
                })),
                output: nullable(plainObject),
                impl: async ({ workplaceId }) => cloneDto(await service.fetchWorkplace({ workplaceId }))
            }
        }
    });
};
