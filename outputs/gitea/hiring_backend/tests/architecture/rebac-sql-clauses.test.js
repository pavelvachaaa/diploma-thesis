const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '../../src/domain');
const TARGET_EXTENSIONS = new Set(['.js']);
const HELPER_PATTERNS = [
    'addPermissionExists',
    'addRelationPermissionExists',
    'addAnyPermissionExists'
];

const walk = (dir) => {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    const files = [];

    for (const entry of entries) {
        const absolutePath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            files.push(...walk(absolutePath));
            continue;
        }

        if (TARGET_EXTENSIONS.has(path.extname(entry.name))) {
            files.push(absolutePath);
        }
    }

    return files;
};

describe('ReBAC SQL clause guardrails', () => {
    it('does not manually wrap permission helpers inside raw AND/WHERE EXISTS blocks', () => {
        const violations = [];

        for (const absolutePath of walk(ROOT)) {
            const source = fs.readFileSync(absolutePath, 'utf8');

            if (!HELPER_PATTERNS.some((name) => source.includes(name))) {
                continue;
            }

            for (const helperName of HELPER_PATTERNS) {
                const andExistsPattern = new RegExp(`AND EXISTS\\s*\\([\\s\\S]{0,800}${helperName}\\s*\\(`, 'm');
                const whereExistsPattern = new RegExp(`WHERE EXISTS\\s*\\([\\s\\S]{0,800}${helperName}\\s*\\(`, 'm');

                if (andExistsPattern.test(source) || whereExistsPattern.test(source)) {
                    violations.push(path.relative(path.join(__dirname, '../..'), absolutePath));
                    break;
                }
            }
        }

        expect(violations).toEqual([]);
    });
});
