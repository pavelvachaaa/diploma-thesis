const { createContractPort } = require('@shared/contracts/runtime');
const {
    entityId,
    plainObject,
    nonEmptyString,
    nullable,
    objectShape,
    tuple
} = require('@shared/contracts/runtime/common');
const { cloneDto, requireServiceMethods } = require('@shared/contracts/runtime/portUtils');

const applicantStatusUpdateDto = nullable(objectShape({
    id: entityId
}, { allowExtra: true }));

module.exports = ({ applicantsService }) => {
    const { updateApplicantStatus } = requireServiceMethods(
        applicantsService,
        'applicantsService',
        'ApplicantsStatusCommandPort',
        ['updateApplicantStatus']
    );

    return createContractPort({
        portName: 'ApplicantsStatusCommandPort',
        methods: {
            updateApplicantStatus: {
                input: tuple(entityId, nonEmptyString('status code'), nullable(entityId)),
                output: applicantStatusUpdateDto,
                impl: async (applicantId, statusCode, actorUserId = null) => {
                    const updated = await updateApplicantStatus(
                        applicantId,
                        statusCode,
                        actorUserId,
                        null,
                        {}
                    );

                    return updated ? cloneDto(updated) : null;
                }
            }
        }
    });
};
