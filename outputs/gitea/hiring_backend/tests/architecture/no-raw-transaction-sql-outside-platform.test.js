const fs = require('node:fs');
const path = require('node:path');

const SRC_DIR = path.join(__dirname, '../../src');
const ROOT_DIR = path.join(__dirname, '../..');

// Raw SQL transaction control belongs only to transaction infrastructure and migration runner.
const ALLOWED_RAW_TRANSACTION_FILES = new Set([
    'src/database/migrate.js',
    'src/platform/transaction/createTxRunner.js'
]);

const RAW_TRANSACTION_SQL_REGEX = /query\(\s*['"`](BEGIN|COMMIT|ROLLBACK)['"`]/g;

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

describe('architecture: raw transaction SQL is restricted', () => {
    it('does not introduce new BEGIN/COMMIT/ROLLBACK blocks outside approved transaction infrastructure', () => {
        const files = collectJavaScriptFiles(SRC_DIR);
        const violations = [];

        for (const filePath of files) {
            const source = fs.readFileSync(filePath, 'utf8');
            const hasRawTransactionSql = RAW_TRANSACTION_SQL_REGEX.test(source);
            RAW_TRANSACTION_SQL_REGEX.lastIndex = 0;

            if (!hasRawTransactionSql) {
                continue;
            }

            const relativePath = path.relative(ROOT_DIR, filePath).split(path.sep).join('/');
            if (!ALLOWED_RAW_TRANSACTION_FILES.has(relativePath)) {
                violations.push(relativePath);
            }
        }

        expect(violations).toEqual([]);
    });
});
