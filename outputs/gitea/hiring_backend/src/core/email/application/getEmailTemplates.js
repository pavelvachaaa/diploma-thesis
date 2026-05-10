module.exports = ({ emailTemplatesStorePort }) => {
    return async ({ organizationId, type, actorUserId } = {}) => {
        return emailTemplatesStorePort.getAll({ organizationId, type, actorUserId });
    };
};
