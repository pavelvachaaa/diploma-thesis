module.exports = (core) => ({
    withTransaction: core.withTransaction,
    getAll: core.getAll,
    getById: core.getById,
    getByOrganization: core.getByOrganization,
    create: core.create,
    update: core.update,
    delete: core.delete,
    deleteOne: core.deleteOne
});
