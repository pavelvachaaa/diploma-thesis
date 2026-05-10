const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '../..');
const MIGRATED_MODULES = [
    'contactInquiries',
    'internalUsers',
    'qualification',
    'catalog',
    'organizations',
    'roleAssignments',
    'sectionItems',
    'operations',
    'ai',
    'notification',
    'cv',
    'jobSeekers',
    'cvAnalysis',
    'jobSeekerCvAnalysis',
    'auth',
    'email',
    'jobs',
    'mzcrAccreditations'
];

const collectFiles = (directory) => {
    if (!fs.existsSync(directory)) {
        return [];
    }

    const entries = fs.readdirSync(directory, { withFileTypes: true });
    const files = [];

    for (const entry of entries) {
        const absolute = path.join(directory, entry.name);
        if (entry.isDirectory()) {
            files.push(...collectFiles(absolute));
            continue;
        }

        if (entry.isFile()) {
            files.push(absolute);
        }
    }

    return files;
};

describe('strict hexagon migrated modules', () => {
    it('keeps migrated modules out of legacy domain controller/service/repository runtime paths', () => {
        const violations = [];

        for (const moduleName of MIGRATED_MODULES) {
            for (const slice of ['controller', 'service', 'repository']) {
                const sliceDir = path.join(ROOT, 'src', 'domain', moduleName, slice);
                const runtimeFiles = collectFiles(sliceDir)
                    .filter((filePath) => filePath.endsWith('.js'))
                    .map((filePath) => path.relative(ROOT, filePath));

                violations.push(...runtimeFiles);
            }
        }

        expect(violations).toEqual([]);
    });

    it('keeps core port manifests pure and free of runtime imports', () => {
        const violations = [];

        for (const moduleName of MIGRATED_MODULES) {
            const portsDir = path.join(ROOT, 'src', 'core', moduleName, 'application', 'ports');
            const portFiles = collectFiles(portsDir).filter((filePath) => filePath.endsWith('.port.js'));

            for (const filePath of portFiles) {
                const source = fs.readFileSync(filePath, 'utf8');
                if (source.includes('require(') || source.includes('createContractPort') || source.includes('@shared/contracts/runtime')) {
                    violations.push(path.relative(ROOT, filePath));
                }
            }
        }

        expect(violations).toEqual([]);
    });

    it('migrated modules have expected hexagonal core structure', () => {
        const missing = [];

        for (const moduleName of MIGRATED_MODULES) {
            const appDir = path.join(ROOT, 'src', 'core', moduleName, 'application');
            const portsDir = path.join(appDir, 'ports');

            // application/ must exist and contain at least one .js file (excluding ports/)
            const appFiles = collectFiles(appDir)
                .filter((filePath) => filePath.endsWith('.js') && !filePath.includes(`${path.sep}ports${path.sep}`));

            if (appFiles.length === 0) {
                missing.push(`src/core/${moduleName}/application/ (no application .js files)`);
            }

            // ports/ must contain at least one *.port.js manifest
            const portFiles = fs.existsSync(portsDir)
                ? fs.readdirSync(portsDir).filter((f) => f.endsWith('.port.js'))
                : [];

            if (portFiles.length === 0) {
                missing.push(`src/core/${moduleName}/application/ports/ (no *.port.js files)`);
            }
        }

        expect(missing).toEqual([]);
    });
});
