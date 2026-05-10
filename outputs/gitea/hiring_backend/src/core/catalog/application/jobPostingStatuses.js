// No domain logic today; the port boundary enforces the contract against the persistence adapter.
module.exports = ({ jobPostingStatusesStorePort }) => ({
    getAll: () => jobPostingStatusesStorePort.getAll(),
    getByCode: (code) => jobPostingStatusesStorePort.getByCode(code),
    create: (data) => jobPostingStatusesStorePort.create(data),
    update: (code, data) => jobPostingStatusesStorePort.update(code, data),
    delete: (code) => jobPostingStatusesStorePort.delete(code)
});
