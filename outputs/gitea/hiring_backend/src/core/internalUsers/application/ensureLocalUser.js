const ApplicationError = require('@core/shared/errors/ApplicationError');
const { ErrorCode } = require('@core/shared/errors/ApplicationError');
const CandidateProfile = require('@core/internalUsers/domain/candidateProfile');

module.exports = ({ internalUsersStorePort }) => {
    return async (candidate, options = {}) => {
        const profile = CandidateProfile.create(candidate);

        const mappedOrganization = profile.seatLocation
            ? await internalUsersStorePort.getOrganizationBySeatLocation(profile.seatLocation, options)
            : null;

        if (!mappedOrganization) {
            throw new ApplicationError(`Neznámá seatLocation "${profile.seatLocation || '-'}"`, {
                code: ErrorCode.UNPROCESSABLE
            });
        }

        const existingUser = await internalUsersStorePort.findLocalUserByEmail(profile.email, options);
        if (existingUser) {
            return {
                user: await internalUsersStorePort.updateLocalUserProfile(existingUser.id, {
                    name: profile.name,
                    surname: profile.surname,
                    organization_id: mappedOrganization.id
                }, options),
                organization: mappedOrganization,
                created: false
            };
        }

        return {
            user: await internalUsersStorePort.createLocalInternalUser({
                email: profile.email,
                name: profile.name,
                surname: profile.surname,
                phone: null,
                organization_id: mappedOrganization.id
            }, options),
            organization: mappedOrganization,
            created: true
        };
    };
};
