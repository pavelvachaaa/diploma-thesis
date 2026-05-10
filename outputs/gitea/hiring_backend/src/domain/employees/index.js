module.exports = {
    name: 'employees',
    basePath: __dirname,
    registrations: {
        employeesRepository: './repository',
        employeesService: './service',
        employeesController: './controller/adminEmployees.controller',
        employeesOnboardingController: './controller/adminOnboarding.controller'
    }
};
