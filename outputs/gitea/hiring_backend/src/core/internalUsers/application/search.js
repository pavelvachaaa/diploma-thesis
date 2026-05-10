const normalizeEmail = require('@shared/email/normalizeEmail');
const ApplicationError = require('@core/shared/errors/ApplicationError');
const { ErrorCode } = require('@core/shared/errors/ApplicationError');
const { normalizeSeatLocation } = require('@core/internalUsers/domain/candidateProfile');

module.exports = ({ internalUsersStorePort, internalUserDirectoryPort }) => {
    return async ({ query }) => {
        const normalizedQuery = String(query || '').trim();
        if (!normalizedQuery) {
            throw new ApplicationError('Vyhledávací dotaz je povinný', {
                code: ErrorCode.VALIDATION_ERROR
            });
        }

        const upstreamResults = await internalUserDirectoryPort.searchUsers({
            query: normalizedQuery
        });

        const locations = [...new Set(
            upstreamResults
                .map((candidate) => normalizeSeatLocation(candidate?.seatLocation))
                .filter(Boolean)
        )];
        const emails = [...new Set(
            upstreamResults
                .map((candidate) => normalizeEmail(candidate?.email))
                .filter(Boolean)
        )];

        const [organizations, existingUsers] = await Promise.all([
            internalUsersStorePort.getOrganizationsBySeatLocations(locations),
            internalUsersStorePort.findLocalUsersByEmails(emails)
        ]);

        const organizationsBySeat = new Map(
            organizations.map((organization) => [normalizeSeatLocation(organization?.seat_location), organization])
        );
        const usersByEmail = new Map(
            existingUsers.map((user) => [normalizeEmail(user.email), user])
        );

        const resolvedResults = upstreamResults.map((candidate) => {
            const seatLocation = normalizeSeatLocation(candidate?.seatLocation);
            const mappedOrganization = organizationsBySeat.get(seatLocation) || null;
            const email = normalizeEmail(candidate?.email);

            if (!email) {
                return null;
            }

            const existingUser = usersByEmail.get(email) || null;

            return {
                id: String(candidate?.id || '').trim() || null,
                name: String(candidate?.name || '').trim() || null,
                surname: String(candidate?.surname || '').trim() || null,
                fullName: String(candidate?.fullName || '').trim() || null,
                email,
                seatLocation,
                organizationId: mappedOrganization?.id || null,
                organizationName: mappedOrganization?.name || null,
                localUserId: existingUser?.id || null,
                existsLocally: Boolean(existingUser)
            };
        });

        return resolvedResults.filter(Boolean);
    };
};
