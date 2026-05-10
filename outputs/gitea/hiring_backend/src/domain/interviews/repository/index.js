const createLifecycleRepository = require('./lifecycle');
const createParticipantsRepository = require('./participants');
const createAttachmentsRepository = require('./attachments');
const createQueriesRepository = require('./queries');
const createRemindersRepository = require('./reminders');

module.exports = ({ db, logger }) => {
    const lifecycle = createLifecycleRepository({ db, logger });
    const participants = createParticipantsRepository({ db, logger });
    const attachments = createAttachmentsRepository({ db, logger });
    const reminders = createRemindersRepository({ db, logger });
    const queries = createQueriesRepository({
        db,
        getParticipants: participants.getParticipants,
        getAttachments: attachments.getAttachments
    });

    return {
        ...lifecycle,
        ...queries,
        ...participants,
        ...reminders,
        ...attachments
    };
};
