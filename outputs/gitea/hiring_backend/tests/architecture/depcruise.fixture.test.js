const path = require('path');
const { spawnSync } = require('child_process');

describe('dependency-cruiser fixture guards', () => {
    it('fails on an intentional controller -> repository violation fixture', () => {
        const depcruiseBin = path.join(process.cwd(), 'node_modules', '.bin', 'depcruise');
        const fixtureRoot = path.join('tests', 'fixtures', 'depcruise');
        const fixtureConfig = path.join(fixtureRoot, '.dependency-cruiser.fixture.cjs');

        const result = spawnSync(
            depcruiseBin,
            ['--config', fixtureConfig, fixtureRoot, '--output-type', 'err-long'],
            { cwd: process.cwd(), encoding: 'utf8' }
        );

        expect(result.status).not.toBe(0);
        expect(`${result.stdout || ''}\n${result.stderr || ''}`).toContain('controllers-no-repository-imports-fixture');
    });

    it('fails on intentional domain module direction violations', () => {
        const depcruiseBin = path.join(process.cwd(), 'node_modules', '.bin', 'depcruise');
        const fixtureRoot = path.join('tests', 'fixtures', 'depcruise', 'domain-module');
        const fixtureConfig = path.join(fixtureRoot, '.dependency-cruiser.fixture.cjs');

        const result = spawnSync(
            depcruiseBin,
            ['--config', fixtureConfig, fixtureRoot, '--output-type', 'err-long'],
            { cwd: process.cwd(), encoding: 'utf8' }
        );

        const output = `${result.stdout || ''}\n${result.stderr || ''}`;
        expect(result.status).not.toBe(0);
        expect(output).toContain('domain-controller-service-only-fixture');
        expect(output).toContain('domain-service-direction-fixture');
        expect(output).toContain('domain-repository-direction-fixture');
    });
});
