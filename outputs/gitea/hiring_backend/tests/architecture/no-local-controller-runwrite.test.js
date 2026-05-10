const fs = require('node:fs');
const path = require('node:path');

const DOMAIN_DIR = path.join(__dirname, '../../src/domain');
const ROOT_DIR = path.join(__dirname, '../..');
const LOCAL_RUN_WRITE_REGEX = /const\s+runWrite\s*=\s*async\s*\(/;

const collectFiles = (dir) => {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    const files = [];

    for (const entry of entries) {
        const absolute = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            files.push(...collectFiles(absolute));
            continue;
        }

        if (entry.isFile() && absolute.endsWith('.js')) {
            files.push(absolute);
        }
    }

    return files;
};

describe('architecture: controllers reuse shared idempotent runWrite helper', () => {
    it('does not define local runWrite wrappers in domain controllers', () => {
        const files = collectFiles(DOMAIN_DIR);
        const violations = [];

        for (const filePath of files) {
            const normalized = filePath.split(path.sep).join('/');
            if (!normalized.includes('/controller/')) {
                continue;
            }

            const source = fs.readFileSync(filePath, 'utf8');
            if (LOCAL_RUN_WRITE_REGEX.test(source)) {
                violations.push(path.relative(ROOT_DIR, filePath).split(path.sep).join('/'));
            }
        }

        expect(violations).toEqual([]);
    });
});
