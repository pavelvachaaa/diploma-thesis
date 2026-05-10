const JobChatConversation = require('../../../src/core/ai/domain/JobChatConversation');
const JobTextRefinement = require('../../../src/core/ai/domain/JobTextRefinement');
const JobOfferExtraction = require('../../../src/core/ai/domain/JobOfferExtraction');

describe('AI job chat domain commands', () => {
    it('rejects empty stream message lists with ApplicationError', () => {
        expect(() => JobChatConversation.create({ messages: [] })).toThrow(
            expect.objectContaining({
                code: 'VALIDATION_ERROR',
                message: 'Messages array is required and must not be empty'
            })
        );
    });

    it('rejects invalid refine field types with ApplicationError', () => {
        expect(() => JobTextRefinement.create({
            text: 'Improve this',
            fieldType: 'salary'
        })).toThrow(
            expect.objectContaining({
                code: 'VALIDATION_ERROR',
                message: 'field_type must be one of: description, duty, requirement, benefit'
            })
        );
    });

    it('rejects missing extract offer text with ApplicationError', () => {
        expect(() => JobOfferExtraction.create({ offerText: '' })).toThrow(
            expect.objectContaining({
                code: 'VALIDATION_ERROR',
                message: 'offer_text is required'
            })
        );
    });
});
