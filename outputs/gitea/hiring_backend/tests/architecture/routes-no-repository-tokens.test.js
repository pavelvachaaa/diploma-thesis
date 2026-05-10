const fs = require('node:fs');
const path = require('node:path');

const ROUTES_DIR = path.join(__dirname, '../../src/routes');

const collectRouteFiles = (directory) => {
    const entries = fs.readdirSync(directory, { withFileTypes: true });
    const files = [];

    for (const entry of entries) {
        const absolute = path.join(directory, entry.name);
        if (entry.isDirectory()) {
            files.push(...collectRouteFiles(absolute));
            continue;
        }

        if (entry.isFile() && absolute.endsWith('.js')) {
            files.push(absolute);
        }
    }

    return files;
};

describe('route factories do not request repository tokens', () => {
    it('does not destructure *Repository dependencies in route factory signatures', () => {
        const files = collectRouteFiles(ROUTES_DIR);
        const violations = [];

        for (const filePath of files) {
            const source = fs.readFileSync(filePath, 'utf8');
            const match = source.match(/module\.exports\s*=\s*\(\s*\{([\s\S]*?)\}\s*\)\s*=>/m);
            if (!match) {
                continue;
            }

            const params = match[1];
            const repoTokens = params
                .split(',')
                .map((token) => token.trim())
                .filter(Boolean)
                .filter((token) => /\b\w+Repository\b/.test(token));

            if (repoTokens.length > 0) {
                violations.push({
                    file: path.relative(path.join(__dirname, '../..'), filePath),
                    repositoryTokens: repoTokens
                });
            }
        }

        expect(violations).toEqual([]);
    });
});
