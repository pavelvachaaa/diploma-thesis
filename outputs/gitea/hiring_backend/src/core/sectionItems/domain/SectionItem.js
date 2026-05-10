const {
    ensureNonEmptyString,
    normalizeBoolean,
    normalizeOrderIndex
} = require('@core/shared/validation/primitives');

const create = (data = {}) => {
    ensureNonEmptyString(data.section_type_name, 'section_type_name is required');
    ensureNonEmptyString(data.item_text, 'item_text is required');

    return Object.freeze({
        section_type_name: data.section_type_name,
        item_text: data.item_text,
        is_active: normalizeBoolean(data.is_active, { fallback: true, fieldName: 'is_active' }),
        order_index: normalizeOrderIndex(data.order_index, { fallback: 0 })
    });
};

const update = (data = {}) => {
    ensureNonEmptyString(data.section_type_name, 'section_type_name is required');
    ensureNonEmptyString(data.item_text, 'item_text is required');

    return Object.freeze({
        section_type_name: data.section_type_name,
        item_text: data.item_text,
        is_active: normalizeBoolean(data.is_active, { fieldName: 'is_active', required: true }),
        order_index: normalizeOrderIndex(data.order_index, { required: true })
    });
};

module.exports = Object.freeze({
    create,
    update
});
