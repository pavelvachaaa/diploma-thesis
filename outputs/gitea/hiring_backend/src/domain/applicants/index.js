module.exports = {
    name: 'applicants',
    basePath: __dirname,
    registrations: {
        applicantsRepository: './repository/applicants.repository',
        attachmentsRepository: './repository/attachments.repository',
        notesRepository: './repository/notes.repository',
        statusRepository: './repository/status.repository',
        applicantsService: './service',
        applicantsController: './controller'
    }
};
