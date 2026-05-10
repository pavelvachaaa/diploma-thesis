// No domain logic today; the port boundary enforces the contract against the persistence adapter.
module.exports = ({ documentTypesStorePort }) => ({
    getAll: () => documentTypesStorePort.getAll(),
    getById: (id) => documentTypesStorePort.getById(id),
    create: (data) => documentTypesStorePort.create(data),
    update: (id, data) => documentTypesStorePort.update(id, data),
    delete: (id) => documentTypesStorePort.delete(id)
});
