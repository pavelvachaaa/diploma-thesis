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

const getModuleName = (filePath) => {
    const normalized = filePath.split(path.sep).join('/');
    const match = normalized.match(/src\/domain\/([^/]+)\//);
    return match ? match[1] : null;
};

describe('domain boundary: no cross-module direct service-slice imports', () => {
    it('does not import @domain/<other>/service/<slice> from domain modules', () => {
        const files = collectFiles(DOMAIN_DIR);
        const violations = [];

        for (const filePath of files) {
            const currentModule = getModuleName(filePath);
            if (!currentModule) {
                continue;
            }

            const source = fs.readFileSync(filePath, 'utf8');
            const importRegex = /require\(['"]@domain\/([^/'"]+)\/service\/([^'"]+)['"]\)/g;
            let match = importRegex.exec(source);
            while (match) {
                const importedModule = match[1];
                const importedPath = match[2];
                const normalizedPath = importedPath.replace(/\\/g, '/');
                const isIndexImport = normalizedPath === 'index' || normalizedPath === 'index.js';

                if (importedModule !== currentModule && !isIndexImport) {
                    violations.push({
                        file: path.relative(path.join(__dirname, '../..'), filePath),
                        currentModule,
                        importedModule,
                        importedPath
                    });
                }

                match = importRegex.exec(source);
            }
        }

        expect(violations).toEqual([]);
    });
});
