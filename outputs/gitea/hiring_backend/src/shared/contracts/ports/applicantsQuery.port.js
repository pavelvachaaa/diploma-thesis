const { createContractPort } = require('@shared/contracts/runtime');
const {
    entityId,
    optionsObject,
    plainObject,
    objectShape,
    arrayOf,
    optional,
    nullable,
    tuple
} = require('@shared/contracts/runtime/common');
const {
    cloneDto,
    cloneDtoArray,
    cloneOptions,
    requireServiceMethods
} = require('@shared/contracts/runtime/portUtils');

const applicantSummaryDto = objectShape({
    id: entityId
}, { allowExtra: true });
const applicantStatusEntryDto = objectShape({}, { allowExtra: true });
const applicantAttachmentDto = objectShape({}, { allowExtra: true });
const applicantNoteDto = objectShape({}, { allowExtra: true });
const applicantDossierDto = objectShape({
    applicant: nullable(applicantSummaryDto),
    history: arrayOf(applicantStatusEntryDto),
    attachments: arrayOf(applicantAttachmentDto),
    notes: arrayOf(applicantNoteDto)
}, { allowExtra: true });

module.exports = ({ applicantsService }) => {
    const {
        getApplicantById,
        getApplicantStatusHistory,
        getAttachmentsByApplicantId,
        getApplicantNotes
    } = requireServiceMethods(applicantsService, 'applicantsService', 'ApplicantsQueryPort', [
        'getApplicantById',
        'getApplicantStatusHistory',
        'getAttachmentsByApplicantId',
        'getApplicantNotes'
    ]);

    return createContractPort({
        portName: 'ApplicantsQueryPort',
        methods: {
            getApplicantById: {
                input: tuple(entityId, optional(optionsObject)),
                output: nullable(applicantSummaryDto),
                impl: async (applicantId, accessOptions = {}) => {
                    const applicant = await getApplicantById(applicantId, cloneOptions(accessOptions));
                    return applicant ? cloneDto(applicant) : null;
                }
            },
            getApplicantStatusHistory: {
                input: tuple(entityId, optional(optionsObject)),
                output: arrayOf(applicantStatusEntryDto),
                impl: async (applicantId, accessOptions = {}) =>
                    cloneDtoArray(await getApplicantStatusHistory(applicantId, cloneOptions(accessOptions)))
            },
            getAttachmentsByApplicantId: {
                input: tuple(entityId, optional(optionsObject)),
                output: arrayOf(applicantAttachmentDto),
                impl: async (applicantId, accessOptions = {}) =>
                    cloneDtoArray(await getAttachmentsByApplicantId(applicantId, cloneOptions(accessOptions)))
            },
            getApplicantNotes: {
                input: tuple(entityId, optional(optionsObject)),
                output: arrayOf(applicantNoteDto),
                impl: async (applicantId, accessOptions = {}) =>
                    cloneDtoArray(await getApplicantNotes(applicantId, cloneOptions(accessOptions)))
            },
            getApplicantDossier: {
                input: tuple(entityId, optional(optionsObject)),
                output: applicantDossierDto,
                impl: async (applicantId, accessOptions = {}) => {
                    const normalizedOptions = cloneOptions(accessOptions);
                    const [applicant, history, attachments, notes] = await Promise.all([
                        getApplicantById(applicantId, normalizedOptions),
                        getApplicantStatusHistory(applicantId, normalizedOptions),
                        getAttachmentsByApplicantId(applicantId, normalizedOptions),
                        getApplicantNotes(applicantId, normalizedOptions)
                    ]);

                    return {
                        applicant: applicant ? cloneDto(applicant) : null,
                        history: cloneDtoArray(history),
                        attachments: cloneDtoArray(attachments),
                        notes: cloneDtoArray(notes)
                    };
                }
            }
        }
    });
};
