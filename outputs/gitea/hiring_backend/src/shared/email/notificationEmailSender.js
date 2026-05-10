module.exports = (dependencies) => {
    const sendNotificationEmail = async (payload) => {
        if (!dependencies.emailService?.sendNotificationEmail) {
            throw new Error('emailService.sendNotificationEmail is not available');
        }

        return dependencies.emailService.sendNotificationEmail(payload);
    };

    return {
        sendNotificationEmail
    };
};
