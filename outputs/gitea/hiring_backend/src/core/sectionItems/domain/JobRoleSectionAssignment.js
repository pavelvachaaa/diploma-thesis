const {
    ensureNonEmptyString,
    normalizeOrderIndex
} = require('@core/shared/validation/primitives');
const { normalizeTextSource } = require('@core/sectionItems/domain/SectionItemTextSource');

const create = (data = {}) => {
    ensureNonEmptyString(data.section_type_name, 'section_type_name is required');
    const textSource = normalizeTextSource(data);

    return Object.freeze({
        section_type_name: data.section_type_name,
        section_item_id: textSource.section_item_id,
        custom_text: textSource.custom_text,
        order_index: normalizeOrderIndex(data.order_index, { fallback: 0 })
    });
};

const update = (data = {}) => {
    ensureNonEmptyString(data.section_type_name, 'section_type_name is required');
    const textSource = normalizeTextSource(data);

    return Object.freeze({
        section_type_name: data.section_type_name,
        section_item_id: textSource.section_item_id,
        custom_text: textSource.custom_text,
        order_index: normalizeOrderIndex(data.order_index, { required: true })
    });
};

module.exports = Object.freeze({
    create,
    update
});
