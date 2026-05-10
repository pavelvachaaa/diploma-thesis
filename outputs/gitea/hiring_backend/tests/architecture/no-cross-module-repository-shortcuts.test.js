const fs = require('node:fs');
const path = require('node:path');

const DOMAIN_DIR = path.join(__dirname, '../../src/domain');

const collectFiles = (dir) => {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    const files = [];

    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            files.push(...collectFiles(fullPath));
            continue;
        }

        if (entry.isFile() && fullPath.endsWith('.js')) {
            files.push(fullPath);
        }
    }

    return files;
};

describe('domain boundary: no cross-module repository shortcuts', () => {
    it('does not import @domain/<other>/repository from service or events layers', () => {
        const files = collectFiles(DOMAIN_DIR);
        const violations = [];

        for (const filePath of files) {
            const normalized = filePath.split(path.sep).join('/');
            const layerMatch = normalized.match(/src\/domain\/([^/]+)\/(service|events)\//);
            if (!layerMatch) {
                continue;
            }

            const currentModule = layerMatch[1];
            const source = fs.readFileSync(filePath, 'utf8');

            const importRegex = /require\(['"]@domain\/([^/'"]+)\/repository(?:\/[^'"]*)?['"]\)/g;
            let match = importRegex.exec(source);
            while (match) {
                const importedModule = match[1];
                if (importedModule !== currentModule) {
                    violations.push({
                        file: path.relative(path.join(__dirname, '../..'), filePath),
                        currentModule,
                        importedModule
                    });
                }
                match = importRegex.exec(source);
            }
        }

        expect(violations).toEqual([]);
    });
});
