const { createContractPort } = require('@shared/contracts/runtime');
const {
    entityId,
    stringArray,
    objectShape,
    booleanFlag,
    tuple
} = require('@shared/contracts/runtime/common');
const { cloneDto, requireServiceMethods } = require('@shared/contracts/runtime/portUtils');

const membershipAccessRequestDto = objectShape({
    actorUserId: entityId,
    organizationId: entityId,
    allowedRoles: stringArray
}, { allowExtra: true });
const membershipAccessGrantDto = objectShape({
    granted: booleanFlag()
}, { allowExtra: true });

module.exports = ({ rebacService }) => {
    const { ensureMembershipCreateAccess } = requireServiceMethods(
        rebacService,
        'rebacService',
        'MembershipAccessPort',
        ['ensureMembershipCreateAccess']
    );

    return createContractPort({
        portName: 'MembershipAccessPort',
        methods: {
            ensureMembershipCreateAccess: {
                input: tuple(membershipAccessRequestDto),
                output: membershipAccessGrantDto,
                impl: async (request) => {
                    const granted = await ensureMembershipCreateAccess(cloneDto(request));
                    return {
                        granted: granted === true
                    };
                }
            }
        }
    });
};
