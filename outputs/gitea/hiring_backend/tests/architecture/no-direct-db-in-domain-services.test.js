const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const ALLOWLIST = new Set([
    'applicantsService',
    'calendarService',
    'cvAnalysisConsumerService',
    'cvAnalysisService',
    'documentsService',
    'jobEmbeddingsService',
    'jobSeekerCvAnalysisService',
    'jobSeekerCvConsumerService'
]);

describe('architecture: domain services should not inject db directly', () => {
    it('flags new direct db injections outside the explicit allowlist', () => {
        const root = path.join(__dirname, '../..');
        execFileSync('node', ['scripts/export-container-graph.js'], {
            cwd: root,
            stdio: 'pipe'
        });

        const reportPath = path.join(root, 'reports', 'container-graph', 'services.json');
        const payload = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
        const services = payload.services || [];

        const violations = services
            .filter((service) => {
                const infraDeps = Array.isArray(service.dependencies?.infra)
                    ? service.dependencies.infra
                    : [];
                return infraDeps.includes('db') && !ALLOWLIST.has(service.token);
            })
            .map((service) => service.token)
            .sort();

        expect(violations).toEqual([]);
    });
});
