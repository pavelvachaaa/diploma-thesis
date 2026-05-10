module.exports = ({ logger }) => {
    const runBestEffort = ({ action, interviewId = null, task }) => {
        Promise.resolve()
            .then(task)
            .catch((error) => {
                logger.error(action, {
                    error: error.message,
                    interviewId,
                    interview_id: interviewId,
                    action,
                    backgroundAction: action
                });
            });
    };

    return {
        runBestEffort
    };
};
