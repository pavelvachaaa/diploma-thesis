module.exports = {
    name: 'chat',
    basePath: __dirname,
    registrations: {
        chatRepository: './repository',
        chatAccessPolicy: './chatAccessPolicy',
        chatService: './service',
        chatController: './controller'
    }
};
