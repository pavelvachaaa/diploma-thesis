const { createContractPort } = require('@shared/contracts/runtime');
const {
    nonEmptyString,
    nullable,
    objectShape,
    tuple
} = require('@shared/contracts/runtime/common');
const { cloneDto, requireServiceMethods } = require('@shared/contracts/runtime/portUtils');

const onboardingTemplateDto = nullable(objectShape({
    id: nullable(nonEmptyString('template id'))
}, { allowExtra: true }));

module.exports = ({ onboardingDocumentsService }) => {
    const { getOnboardingTemplateByFilename } = requireServiceMethods(
        onboardingDocumentsService,
        'onboardingDocumentsService',
        'OnboardingTemplateQueryPort',
        ['getOnboardingTemplateByFilename']
    );

    return createContractPort({
        portName: 'OnboardingTemplateQueryPort',
        methods: {
            getOnboardingTemplateByFilename: {
                input: tuple(nonEmptyString('template filename')),
                output: onboardingTemplateDto,
                impl: async (filename) => {
                    const template = await getOnboardingTemplateByFilename(filename);
                    return template ? cloneDto(template) : null;
                }
            }
        }
    });
};
