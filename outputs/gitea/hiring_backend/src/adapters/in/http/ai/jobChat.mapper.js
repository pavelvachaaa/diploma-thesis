const toStreamChatInput = (body = {}, user = {}) => ({
    messages: body.messages,
    existingOfferText: body.existing_offer_text,
    organizationName: user.organization || ''
});

const toRefineTextInput = (body = {}) => ({
    text: body.text,
    fieldType: body.field_type,
    jobTitle: body.job_title
});

const toExtractJobInput = (body = {}, user = {}) => ({
    offerText: body.offer_text,
    organizationName: user.organization || ''
});

module.exports = {
    toStreamChatInput,
    toRefineTextInput,
    toExtractJobInput
};
