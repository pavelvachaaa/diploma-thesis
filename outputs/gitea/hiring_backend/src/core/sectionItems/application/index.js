const SectionItem = require('@core/sectionItems/domain/SectionItem');
const SectionItemOrder = require('@core/sectionItems/domain/SectionItemOrder');
const JobRoleSectionAssignment = require('@core/sectionItems/domain/JobRoleSectionAssignment');
const JobRoleSectionReplacement = require('@core/sectionItems/domain/JobRoleSectionReplacement');
const {
    normalizeListOptions,
    normalizeSectionTypeLookup
} = require('@core/sectionItems/application/queryOptions');

module.exports = ({
    sectionItemsCatalogStorePort,
    jobRoleSectionItemsStorePort,
    sectionItemsUnitOfWorkPort
}) => {
    const getAllSectionTypes = () => sectionItemsCatalogStorePort.getAllSectionTypes();

    const getAll = (options = {}) => sectionItemsCatalogStorePort.getAll(normalizeListOptions(options));

    const getBySectionType = (sectionTypeName, options = {}) => sectionItemsCatalogStorePort.getBySectionType(
        sectionTypeName,
        normalizeSectionTypeLookup(options)
    );

    const ensureCatalogItems = (sectionTypeName, texts, options = {}) => (
        sectionItemsCatalogStorePort.ensureCatalogItems(sectionTypeName, texts, options)
    );

    const getById = (id) => sectionItemsCatalogStorePort.getById(id);

    const create = (data) => sectionItemsCatalogStorePort.create(SectionItem.create(data));

    const update = (id, data) => sectionItemsCatalogStorePort.update(id, SectionItem.update(data));

    const deleteOne = (id) => sectionItemsCatalogStorePort.delete(id);

    const updateOrderIndices = (items) => {
        const normalizedItems = SectionItemOrder.createList(items);

        return sectionItemsUnitOfWorkPort.runInTransaction(async (client) => {
            for (const item of normalizedItems) {
                await sectionItemsCatalogStorePort.updateOrderIndex(item.id, item.order_index, { client });
            }
        }, { label: 'sectionItems.updateOrderIndices' });
    };

    const getByJobRole = (jobRoleId, options = {}) => jobRoleSectionItemsStorePort.getByJobRole(jobRoleId, options);

    const addToJobRole = (jobRoleId, data, options = {}) => jobRoleSectionItemsStorePort.addToJobRole(
        jobRoleId,
        JobRoleSectionAssignment.create(data),
        options
    );

    const updateJobRoleItem = (id, data, options = {}) => jobRoleSectionItemsStorePort.updateJobRoleItem(
        id,
        JobRoleSectionAssignment.update(data),
        options
    );

    const removeFromJobRole = (id, options = {}) => jobRoleSectionItemsStorePort.removeFromJobRole(id, options);

    const replaceJobRoleSectionItems = (jobRoleId, sectionTypeName, items, options = {}) => {
        const normalizedItems = JobRoleSectionReplacement.createList(items);

        return sectionItemsUnitOfWorkPort.runInTransaction(
            (client) => jobRoleSectionItemsStorePort.replaceJobRoleSectionItems(
                jobRoleId,
                sectionTypeName,
                normalizedItems,
                { ...options, client }
            ),
            { label: 'sectionItems.replaceJobRoleSectionItems' }
        );
    };

    return {
        getAllSectionTypes,
        getAll,
        getBySectionType,
        ensureCatalogItems,
        getById,
        create,
        update,
        delete: deleteOne,
        updateOrderIndices,
        getByJobRole,
        addToJobRole,
        updateJobRoleItem,
        removeFromJobRole,
        replaceJobRoleSectionItems
    };
};
