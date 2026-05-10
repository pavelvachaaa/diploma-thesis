const {
    failWithValidation,
    hasText
} = require('@core/shared/validation/primitives');

const normalizeTextSource = (data = {}) => {
    const sectionItemId = hasText(data.section_item_id) ? data.section_item_id : null;
    const customText = hasText(data.custom_text) ? data.custom_text : null;

    if (!sectionItemId && !customText) {
        failWithValidation('Either section_item_id or custom_text must be provided');
    }

    return Object.freeze({
        section_item_id: sectionItemId,
        custom_text: customText
    });
};

module.exports = Object.freeze({
    normalizeTextSource
});
