const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '../../src');

const BUDGETS = Object.freeze([
    { path: 'platform/rebac/membershipSync.js', maxDeps: 4 },
    { path: 'platform/rebac/resourceSync.js', maxDeps: 3 },
    { path: 'platform/rebac/access.js', maxDeps: 1 },
    { path: 'platform/rebac/reconciler.js', maxDeps: 3 },
    { path: 'domain/applicants/service/createApplicant.js', maxDeps: 10 },
    { path: 'domain/applicants/service/statusTransitions.js', maxDeps: 11 },
    { path: 'domain/applicants/service/noteQueries.js', maxDeps: 1 },
    { path: 'domain/applicants/service/noteMutations.js', maxDeps: 4 },
    { path: 'domain/applicants/service/applicantEmail.js', maxDeps: 2 },
    { path: 'domain/applicants/service/interviewInvitation.js', maxDeps: 2 },
    { path: 'domain/interviews/service/createInterview.js', maxDeps: 6 },
    { path: 'domain/interviews/service/updateInterview.js', maxDeps: 4 },
    { path: 'domain/interviews/service/cancelInterview.js', maxDeps: 4 },
    { path: 'domain/interviews/service/participantMutations.js', maxDeps: 3 },
    { path: 'domain/interviews/service/invitationResend.js', maxDeps: 4 },
    { path: 'domain/interviews/service/attendance.js', maxDeps: 1 },
    { path: 'domain/interviews/service/interviewStatus.js', maxDeps: 2 },
    { path: 'domain/documents/service/attachmentStorage.js', maxDeps: 3 },
    { path: 'domain/documents/service/cvPublish.js', maxDeps: 3 },
    { path: 'domain/documents/service/rollbackCleanup.js', maxDeps: 3 },
    { path: 'domain/documents/service/applicantAttachments.js', maxDeps: 9 },
    { path: 'domain/employees/service/lifecycle.js', maxDeps: 7 },
    { path: 'domain/employees/service/onboarding.js', maxDeps: 7 },
    { path: 'domain/employees/service/communication.js', maxDeps: 2 },
    { path: 'domain/employees/service/roles.js', maxDeps: 3 },
    { path: 'domain/employees/service/deletion.js', maxDeps: 4 },
    { path: 'core/jobs/application/createJob.js', maxDeps: 7 },
    { path: 'core/jobs/application/getMatchingJobSeekers.js', maxDeps: 5 },
    { path: 'core/jobs/application/updateAuthorizedPeople.js', maxDeps: 4 }
]);

const extractFactoryDeps = (relativePath) => {
    const source = fs.readFileSync(path.join(ROOT, relativePath), 'utf8');
    const match = source.match(/module\.exports\s*=\s*\(\s*\{([\s\S]*?)\}\s*\)\s*=>/m);
    if (!match) {
        throw new Error(`Could not extract factory deps from ${relativePath}`);
    }

    const depsSection = match[1]
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/\/\/.*$/gm, '');

    return depsSection
        .split(',')
        .map((entry) => entry.trim())
        .filter(Boolean)
        .map((entry) => entry.replace(/=.*$/, '').trim())
        .map((entry) => entry.replace(/^\.\.\./, '').trim())
        .filter(Boolean);
};

describe('service leaf coupling guardrails', () => {
    it('keeps selected leaf modules within dependency budgets', () => {
        const violations = [];

        for (const budget of BUDGETS) {
            const deps = extractFactoryDeps(budget.path);
            if (deps.length > budget.maxDeps) {
                violations.push(`${budget.path}: ${deps.length} > ${budget.maxDeps}`);
            }
        }

        expect(violations).toEqual([]);
    });
});
