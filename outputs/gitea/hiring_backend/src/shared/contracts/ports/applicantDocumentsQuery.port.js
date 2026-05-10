const { createContractPort } = require('@shared/contracts/runtime');
const {
    entityId,
    objectShape,
    arrayOf,
    tuple
} = require('@shared/contracts/runtime/common');
const { cloneDtoArray, requireServiceMethods } = require('@shared/contracts/runtime/portUtils');

const applicantAttachmentRefDto = objectShape({}, { allowExtra: true });

module.exports = ({ documentsService }) => {
    const { getApplicantAttachments } = requireServiceMethods(
        documentsService,
        'documentsService',
        'ApplicantDocumentsQueryPort',
        ['getApplicantAttachments']
    );

    return createContractPort({
        portName: 'ApplicantDocumentsQueryPort',
        methods: {
            getApplicantAttachments: {
                input: tuple(entityId),
                output: arrayOf(applicantAttachmentRefDto),
                impl: async (applicantId) =>
                    cloneDtoArray(await getApplicantAttachments(applicantId))
            }
        }
    });
};
