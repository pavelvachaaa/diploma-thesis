const fs = require('node:fs');
const path = require('node:path');

const SRC_DIR = path.join(__dirname, '../../src');

const collectJavaScriptFiles = (dir) => {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    const files = [];

    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
            files.push(...collectJavaScriptFiles(fullPath));
            continue;
        }

        if (entry.isFile() && fullPath.endsWith('.js')) {
            files.push(fullPath);
        }
    }

    return files;
};

describe('architecture: no `transactionManager || createTxRunner` branching', () => {
    it('uses createTxRunner with injected transactionManager instead of local OR fallback pattern', () => {
        const files = collectJavaScriptFiles(SRC_DIR);
        const violations = [];
        const pattern = /transactionManager\s*\|\|\s*createTxRunner/g;

        for (const filePath of files) {
            const source = fs.readFileSync(filePath, 'utf8');
            if (pattern.test(source)) {
                violations.push(path.relative(path.join(__dirname, '../..'), filePath));
            }
            pattern.lastIndex = 0;
        }

        expect(violations).toEqual([]);
    });
});
