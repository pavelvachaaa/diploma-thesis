const fs = require('node:fs');
const path = require('node:path');

describe('hotspot decomposition guardrails', () => {
    const root = path.join(__dirname, '../../src');
    const FILE_BUDGETS = Object.freeze([
        { path: 'domain/onboardingDocuments/repository/core.js', maxLines: 120 },
        { path: 'domain/onboardingDocuments/repository/core/assignments.js', maxLines: 100 },
        { path: 'domain/onboardingDocuments/repository/core/jobRoleAssignments.js', maxLines: 160 },
        { path: 'domain/onboardingDocuments/repository/core/workflowAssignments.js', maxLines: 200 },
        { path: 'domain/onboardingDocuments/repository/core/stepAssignments.js', maxLines: 200 },
        { path: 'domain/onboardingDocuments/repository/core/userDocuments.js', maxLines: 210 },
        { path: 'domain/onboardingDocuments/repository/core/downloads.js', maxLines: 170 },
        { path: 'domain/onboardingDocuments/repository/core/documentCatalog.js', maxLines: 280 },
        { path: 'domain/chat/repository/index.js', maxLines: 40 },
        { path: 'domain/chat/repository/messages.js', maxLines: 240 },
        { path: 'domain/chat/repository/threads.js', maxLines: 120 },
        { path: 'domain/chat/repository/directory.js', maxLines: 170 },
        { path: 'adapters/out/persistence/sectionItems/catalog.js', maxLines: 290 },
        { path: 'adapters/out/persistence/sectionItems/jobRoleAssignments.js', maxLines: 260 },
        { path: 'adapters/out/persistence/jobSeekers/index.js', maxLines: 40 },
        { path: 'adapters/out/persistence/jobSeekers/shared.js', maxLines: 140 },
        { path: 'adapters/out/persistence/jobSeekers/reads.js', maxLines: 180 },
        { path: 'adapters/out/persistence/jobSeekers/writes.js', maxLines: 200 },
        { path: 'adapters/out/persistence/jobSeekers/attachments.js', maxLines: 110 },
        { path: 'adapters/out/persistence/jobs/index.js', maxLines: 40 },
        { path: 'domain/workflows/repository/index.js', maxLines: 120 },
        { path: 'core/notification/application/index.js', maxLines: 140 },
        { path: 'domain/employees/service/index.js', maxLines: 120 },
        { path: 'core/jobs/application/index.js', maxLines: 70 },
        { path: 'domain/applicants/service/index.js', maxLines: 140 },
        { path: 'domain/applicants/service/createApplicant.js', maxLines: 120 },
        { path: 'domain/applicants/service/statusTransitions.js', maxLines: 140 },
        { path: 'domain/applicants/service/notes.js', maxLines: 40 },
        { path: 'domain/applicants/service/noteQueries.js', maxLines: 40 },
        { path: 'domain/applicants/service/noteMutations.js', maxLines: 120 },
        { path: 'domain/applicants/service/communication.js', maxLines: 40 },
        { path: 'domain/applicants/service/applicantEmail.js', maxLines: 90 },
        { path: 'domain/applicants/service/interviewInvitation.js', maxLines: 90 },
        { path: 'domain/applicants/repository/applicants.repository.js', maxLines: 50 },
        { path: 'domain/applicants/repository/applicants.shared.js', maxLines: 70 },
        { path: 'domain/applicants/repository/applicants.writes.js', maxLines: 140 },
        { path: 'domain/applicants/repository/applicants.reads.js', maxLines: 130 },
        { path: 'domain/applicants/repository/applicants.listing.js', maxLines: 130 },
        { path: 'domain/applicants/repository/notes.repository.js', maxLines: 50 },
        { path: 'domain/applicants/repository/notes.shared.js', maxLines: 70 },
        { path: 'domain/applicants/repository/notes.reads.js', maxLines: 110 },
        { path: 'domain/applicants/repository/notes.mutations.js', maxLines: 130 },
        { path: 'domain/applicants/repository/attachments.repository.js', maxLines: 50 },
        { path: 'domain/applicants/repository/attachments.shared.js', maxLines: 70 },
        { path: 'domain/applicants/repository/attachments.reads.js', maxLines: 120 },
        { path: 'domain/applicants/repository/attachments.mutations.js', maxLines: 120 },
        { path: 'domain/interviews/service/index.js', maxLines: 150 },
        { path: 'domain/interviews/service/interviewCrud.js', maxLines: 40 },
        { path: 'domain/interviews/service/createInterview.js', maxLines: 100 },
        { path: 'domain/interviews/service/updateInterview.js', maxLines: 80 },
        { path: 'domain/interviews/service/cancelInterview.js', maxLines: 90 },
        { path: 'domain/interviews/service/participants.js', maxLines: 60 },
        { path: 'domain/interviews/service/participantMutations.js', maxLines: 100 },
        { path: 'domain/interviews/service/invitationResend.js', maxLines: 130 },
        { path: 'domain/interviews/service/attendance.js', maxLines: 40 },
        { path: 'domain/interviews/service/interviewCrud.js', maxLines: 220 },
        { path: 'domain/interviews/service/interviewStatus.js', maxLines: 80 },
        { path: 'domain/interviews/repository/lifecycle.js', maxLines: 70 },
        { path: 'domain/interviews/repository/create.js', maxLines: 140 },
        { path: 'domain/interviews/repository/updates.js', maxLines: 150 },
        { path: 'domain/interviews/repository/statusTransitions.js', maxLines: 130 },
        { path: 'domain/documents/service/applicantAttachments.js', maxLines: 130 },
        { path: 'domain/documents/service/attachmentStorage.js', maxLines: 60 },
        { path: 'domain/documents/service/cvPublish.js', maxLines: 60 },
        { path: 'domain/documents/service/rollbackCleanup.js', maxLines: 60 },
        { path: 'domain/documents/repository/index.js', maxLines: 50 },
        { path: 'domain/documents/repository/applicantAttachments.js', maxLines: 100 },
        { path: 'domain/documents/repository/chatAttachments.js', maxLines: 50 },
        { path: 'domain/documents/repository/downloads.js', maxLines: 80 },
        { path: 'domain/documents/repository/stats.js', maxLines: 70 },
        { path: 'domain/employees/repository/core/writes.js', maxLines: 420 },
        { path: 'adapters/out/persistence/jobSeekerCvAnalysis/index.js', maxLines: 390 },
        { path: 'platform/outbox/handlers.js', maxLines: 120 },
        { path: 'platform/auth/index.js', maxLines: 140 },
        { path: 'platform/audit/index.js', maxLines: 140 },
        { path: 'platform/rebac/index.js', maxLines: 120 },
        { path: 'platform/rabbitmq/consumerRunner.js', maxLines: 420 },
        { path: 'shared/file/download.js', maxLines: 160 }
    ]);

    const lineCount = (relativePath) => {
        const absolutePath = path.join(root, relativePath);
        const content = fs.readFileSync(absolutePath, 'utf8');
        return content.split('\n').length;
    };

    it('keeps hotspot entrypoints within size budgets', () => {
        const violations = [];

        for (const budget of FILE_BUDGETS) {
            const measured = lineCount(budget.path);
            if (measured <= budget.maxLines) {
                continue;
            }
            violations.push(`${budget.path}: ${measured} > ${budget.maxLines}`);
        }

        expect(violations).toEqual([]);
    });
});
