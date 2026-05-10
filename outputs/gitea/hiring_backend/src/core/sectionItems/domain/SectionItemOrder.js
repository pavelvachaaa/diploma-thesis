const {
    ensureNonEmptyString,
    failWithValidation,
    normalizeOrderIndex
} = require('@core/shared/validation/primitives');

const createList = (items) => {
    if (!Array.isArray(items)) {
        failWithValidation('Items must be an array');
    }

    return Object.freeze(items.map((item) => {
        ensureNonEmptyString(item?.id, 'item id is required');

        return Object.freeze({
            id: item.id,
            order_index: normalizeOrderIndex(item.order_index, { required: true })
        });
    }));
};

module.exports = Object.freeze({
    createList
});
