module.exports = {
    name: 'onboardingSteps',
    basePath: __dirname,
    registrations: {
        onboardingStepsRepository: './repository',
        onboardingStepsService: './service',
        onboardingStepsController: './controller/employeeOnboardingSteps.controller',
        onboardingFormsController: './controller/adminOnboardingForms.controller'
    }
};
