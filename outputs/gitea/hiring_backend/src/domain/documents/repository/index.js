const createShared = require('./shared');
const createApplicantAttachments = require('./applicantAttachments');
const createChatAttachments = require('./chatAttachments');
const createDownloads = require('./downloads');
const createStats = require('./stats');

module.exports = ({ db }) => {
    const shared = createShared({ db });
    const applicantAttachments = createApplicantAttachments({
        db,
        ...shared
    });
    const chatAttachments = createChatAttachments(shared);
    const downloads = createDownloads({
        db,
        ...shared
    });
    const stats = createStats({
        db,
        ...shared
    });

    return {
        ...applicantAttachments,
        ...chatAttachments,
        ...downloads,
        ...stats
    };
};
