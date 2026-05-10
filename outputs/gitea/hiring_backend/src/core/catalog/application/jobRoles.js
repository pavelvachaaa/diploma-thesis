const { getUniqueSortedJobRoleNames } = require('@core/catalog/domain/jobRoleNames');

module.exports = ({ jobRolesStorePort }) => ({
    getAll: (options) => jobRolesStorePort.getAll(options),
    getById: (id, options = {}) => jobRolesStorePort.getById(id, options),
    getByOrganization: (organizationId, options = {}) => jobRolesStorePort.getByOrganization(organizationId, options),
    create: (data, options = {}) => jobRolesStorePort.create(data, options),
    update: (id, data, options = {}) => jobRolesStorePort.update(id, data, options),
    delete: (id, options = {}) => jobRolesStorePort.delete(id, options),
    getAllClassifications: () => jobRolesStorePort.getAllClassifications(),
    getUniqueNames: async () => getUniqueSortedJobRoleNames(await jobRolesStorePort.getUniqueNames())
});
