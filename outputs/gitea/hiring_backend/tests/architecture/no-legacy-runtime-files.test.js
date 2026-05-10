const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '../../src');
const LEGACY_RUNTIME_DIRS = ['controllers', 'services', 'repositories'];

describe('legacy flat runtime layers are removed', () => {
    it('contains no runtime js files under src/controllers|src/services|src/repositories', () => {
        const violations = [];

        for (const dirName of LEGACY_RUNTIME_DIRS) {
            const absoluteDir = path.join(ROOT, dirName);
            if (!fs.existsSync(absoluteDir)) {
                continue;
            }

            const stack = [absoluteDir];
            while (stack.length > 0) {
                const current = stack.pop();
                const entries = fs.readdirSync(current, { withFileTypes: true });

                for (const entry of entries) {
                    const absolute = path.join(current, entry.name);
                    if (entry.isDirectory()) {
                        stack.push(absolute);
                        continue;
                    }

                    if (!entry.isFile()) {
                        continue;
                    }

                    if (entry.name.endsWith('.js')) {
                        violations.push(path.relative(ROOT, absolute));
                    }
                }
            }
        }

        expect(violations).toEqual([]);
    });
});
