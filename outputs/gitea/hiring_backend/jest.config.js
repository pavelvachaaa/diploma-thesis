const sharedConfig = {
    testEnvironment: 'node',
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
        '^@adapters/(.*)$': '<rootDir>/src/adapters/$1',
        '^@bootstrap/(.*)$': '<rootDir>/src/bootstrap/$1',
        '^@core/(.*)$': '<rootDir>/src/core/$1',
        '^@kernel/(.*)$': '<rootDir>/src/kernel/$1',
        '^@middlewares/(.*)$': '<rootDir>/src/middlewares/$1',
        '^@routes/(.*)$': '<rootDir>/src/routes/$1',
        '^@platform/(.*)$': '<rootDir>/src/platform/$1',
        '^@domain/(.*)$': '<rootDir>/src/domain/$1',
        '^@shared/(.*)$': '<rootDir>/src/shared/$1',
    },
};

module.exports = {
    projects: [
        {
            ...sharedConfig,
            displayName: 'unit',
            testMatch: ['<rootDir>/tests/**/*.test.js'],
        },
        {
            ...sharedConfig,
            displayName: 'integration',
            testMatch: ['<rootDir>/tests-integration/**/*.test.js'],
            globalSetup: '<rootDir>/tests-integration/globalSetup.js',
            globalTeardown: '<rootDir>/tests-integration/globalTeardown.js',
        },
    ],
};
