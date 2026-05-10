const createLifecycleController = require('./lifecycle');
const createQueriesController = require('./queries');
const createParticipantsController = require('./participants');
const createAttachmentsController = require('./attachments');

module.exports = ({
    calendarService,
    applicantsService,
    commandIdempotencyService,
    logger,
    fileDownload
}) => {
    const lifecycle = createLifecycleController({
        calendarService,
        applicantsService,
        commandIdempotencyService,
        logger
    });

    const queries = createQueriesController({
        calendarService,
        logger
    });

    const participants = createParticipantsController({
        calendarService,
        logger
    });

    const attachments = createAttachmentsController({
        calendarService,
        logger,
        fileDownload
    });

    return {
        ...lifecycle,
        ...queries,
        ...participants,
        ...attachments
    };
};
