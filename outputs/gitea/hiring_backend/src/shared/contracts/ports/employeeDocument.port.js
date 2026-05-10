const { createContractPort } = require('@shared/contracts/runtime');
const {
    entityId,
    optionsObject,
    objectShape,
    nonEmptyString,
    numberRange,
    optional,
    nullable,
    tuple
} = require('@shared/contracts/runtime/common');
const { cloneDto, cloneOptions, requireServiceMethods } = require('@shared/contracts/runtime/portUtils');

const uploadedFileDto = objectShape({
    key: nonEmptyString('file key'),
    bucket: optional(nonEmptyString('bucket')),
    mimetype: optional(nonEmptyString('mime type')),
    size: optional(numberRange({ min: 0 })),
    originalName: optional(nonEmptyString('original file name'))
}, { allowExtra: true });
const downloadableEmployeeDocumentDto = nullable(objectShape({
    id: entityId
}, { allowExtra: true }));
const storedEmployeeDocumentDto = objectShape({
    id: entityId
}, { allowExtra: true });

module.exports = ({ onboardingDocumentsService }) => {
    const {
        getEmployeeDocumentForDownload,
        storeUserDocument
    } = requireServiceMethods(
        onboardingDocumentsService,
        'onboardingDocumentsService',
        'EmployeeDocumentPort',
        ['getEmployeeDocumentForDownload', 'storeUserDocument']
    );

    return createContractPort({
        portName: 'EmployeeDocumentPort',
        methods: {
            getEmployeeDocumentForDownload: {
                input: tuple(entityId, entityId, optional(optionsObject)),
                output: downloadableEmployeeDocumentDto,
                impl: async (employeeId, documentId, accessOptions = {}) => {
                    const result = await getEmployeeDocumentForDownload(
                        employeeId,
                        documentId,
                        cloneOptions(accessOptions)
                    );
                    return result ? cloneDto(result) : null;
                }
            },
            storeUserDocument: {
                input: tuple(entityId, entityId, uploadedFileDto, optional(optionsObject)),
                output: storedEmployeeDocumentDto,
                impl: async (employeeId, documentId, uploadedFile, accessOptions = {}) =>
                    cloneDto(await storeUserDocument(
                        employeeId,
                        documentId,
                        cloneDto(uploadedFile),
                        cloneOptions(accessOptions)
                    ))
            }
        }
    });
};
