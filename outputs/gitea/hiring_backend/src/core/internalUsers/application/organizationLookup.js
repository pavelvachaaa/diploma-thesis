const { normalizeSeatLocation } = require('@core/internalUsers/domain/candidateProfile');

module.exports = ({ internalUsersStorePort }) => {
    return async (seatLocation, options = {}) => {
        const normalizedSeatLocation = normalizeSeatLocation(seatLocation);
        if (!normalizedSeatLocation) {
            return null;
        }

        return internalUsersStorePort.getOrganizationBySeatLocation(normalizedSeatLocation, options);
    };
};
