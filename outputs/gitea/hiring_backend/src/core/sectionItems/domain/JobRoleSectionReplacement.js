const { failWithValidation } = require('@core/shared/validation/primitives');
const { normalizeTextSource } = require('@core/sectionItems/domain/SectionItemTextSource');

const createList = (items) => {
    if (!Array.isArray(items)) {
        failWithValidation('Items must be an array');
    }

    return Object.freeze(items.map((item) => normalizeTextSource(item)));
};

module.exports = Object.freeze({
    createList
});
