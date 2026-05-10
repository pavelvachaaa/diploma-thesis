const JobChatConversation = require('@core/ai/domain/JobChatConversation');
const JobTextRefinement = require('@core/ai/domain/JobTextRefinement');
const JobOfferExtraction = require('@core/ai/domain/JobOfferExtraction');

module.exports = ({ aiJobChatGatewayPort }) => {
    const streamChat = (input = {}, callbacks, options = {}) => (
        aiJobChatGatewayPort.streamChat(JobChatConversation.create(input), callbacks, options)
    );

    const refineText = (input = {}, callbacks, options = {}) => (
        aiJobChatGatewayPort.refineText(JobTextRefinement.create(input), callbacks, options)
    );

    const extractJob = (input = {}) => (
        aiJobChatGatewayPort.extractJob(JobOfferExtraction.create(input))
    );

    return {
        streamChat,
        refineText,
        extractJob,
        VALID_FIELD_TYPES: JobTextRefinement.VALID_FIELD_TYPES
    };
};
