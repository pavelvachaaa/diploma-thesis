const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

describe('architecture: hotspot services have zero cross-module service dependencies', () => {
    it('enforces serviceDeps=0 for key hotspots', () => {
        const root = path.join(__dirname, '../..');
        execFileSync('node', ['scripts/export-container-graph.js'], {
            cwd: root,
            stdio: 'pipe'
        });

        const reportPath = path.join(root, 'reports', 'container-graph', 'services.json');
        const payload = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
        const services = new Map(
            (payload.services || []).map((service) => [service.token, service])
        );

        const hotspots = [
            'employeesService',
            'calendarService',
            'applicantsService',
            'documentsService',
            'jobsService'
        ];

        for (const token of hotspots) {
            const service = services.get(token);
            expect(service).toBeDefined();
            expect(Array.isArray(service.dependencies?.services)
                ? service.dependencies.services.length
                : 0).toBe(0);
        }
    });
});
