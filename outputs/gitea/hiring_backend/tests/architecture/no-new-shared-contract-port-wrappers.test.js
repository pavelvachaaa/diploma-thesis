const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '../..');
const SHARED_PORTS_DIR = path.join(ROOT, 'src', 'shared', 'contracts', 'ports');
const LEGACY_SHARED_PORT_WRAPPER_ALLOWLIST = Object.freeze([
    'applicantDocumentsQuery.port.js',
    'applicantEmail.port.js',
    'applicantsQuery.port.js',
    'applicantsStatusCommand.port.js',
    'auditQuery.port.js',
    'emailSender.port.js',
    'employeeDocument.port.js',
    'employeeOnboardingQuery.port.js',
    'employeeOnboardingStep.port.js',
    'jobEmbedding.port.js',
    'jobPermission.port.js',
    'jobSeekerCvAnalysisQuery.port.js',
    'membershipAccess.port.js',
    'notificationUrl.port.js',
    'onboardingStepsAdmin.port.js',
    'onboardingTemplateQuery.port.js'
]);

describe('shared contract port wrapper migration boundary', () => {
    it('does not add new legacy wrappers under src/shared/contracts/ports', () => {
        const actual = fs.readdirSync(SHARED_PORTS_DIR)
            .filter((filename) => filename.endsWith('.port.js'))
            .sort();

        const unexpected = actual.filter(
            (filename) => !LEGACY_SHARED_PORT_WRAPPER_ALLOWLIST.includes(filename)
        );

        expect(unexpected).toEqual([]);
    });
});
