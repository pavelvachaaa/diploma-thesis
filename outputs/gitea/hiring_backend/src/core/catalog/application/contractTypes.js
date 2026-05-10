module.exports = ({ contractTypesStorePort }) => ({
    getAll: () => contractTypesStorePort.getAll(),
    getByCode: (code) => contractTypesStorePort.getByCode(code),
    create: (data) => contractTypesStorePort.create(data),
    update: (code, data) => contractTypesStorePort.update(code, data),
    delete: (code) => contractTypesStorePort.delete(code)
});
