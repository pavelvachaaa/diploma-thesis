const fs = require('node:fs');
const path = require('node:path');

const ROOT_DIR = path.join(__dirname, '../..');
const CONTROLLER_HELPER_IMPORT = "@shared/http/controller";
const PILOT_CONTROLLERS = [
    {
        path: 'src/domain/interviews/controller/lifecycle.js',
        requiresWriteAndSend: true
    },
    {
        path: 'src/domain/workflows/controller/workflows.controller.js',
        requiresWriteAndSend: false
    },
    {
        path: 'src/adapters/in/http/organizations/controller.js',
        requiresWriteAndSend: false
    },
    {
        path: 'src/adapters/in/http/internalUsers/controller.js',
        requiresWriteAndSend: false
    },
    {
        path: 'src/adapters/in/http/contactInquiries/controller.js',
        requiresWriteAndSend: false
    },
    {
        path: 'src/adapters/in/http/qualification/controller.js',
        requiresWriteAndSend: false
    }
];

const readSource = (relativePath) => fs.readFileSync(path.join(ROOT_DIR, relativePath), 'utf8');

describe('architecture: pilot controllers use shared HTTP controller helpers', () => {
    it('adopts handle/sendResult wrappers and avoids manual response boilerplate', () => {
        const violations = [];

        for (const controller of PILOT_CONTROLLERS) {
            const source = readSource(controller.path);

            if (!source.includes(CONTROLLER_HELPER_IMPORT)) {
                violations.push(`${controller.path}: missing shared controller helper import`);
            }

            if (!/\bhandle\s*\(/.test(source)) {
                violations.push(`${controller.path}: missing handle(...) usage`);
            }

            if (!/\bsendResult\s*\(/.test(source)) {
                violations.push(`${controller.path}: missing sendResult(...) usage`);
            }

            if (controller.requiresWriteAndSend && !/\bwriteAndSend\s*\(/.test(source)) {
                violations.push(`${controller.path}: missing writeAndSend(...) usage`);
            }

            if (/res\.status\s*\(/.test(source)) {
                violations.push(`${controller.path}: still contains direct res.status(...) calls`);
            }

            if (/res\.status\s*\(\s*result\.statusCode\s*\)\.json\s*\(\s*result\.body\s*\)/.test(source)) {
                violations.push(`${controller.path}: still contains manual runWrite response boilerplate`);
            }
        }

        expect(violations).toEqual([]);
    });

    it('no longer uses local executeIdempotent boilerplate in the pilot interview lifecycle controller', () => {
        const source = readSource('src/domain/interviews/controller/lifecycle.js');

        expect(source).not.toMatch(/\bexecuteIdempotent\s*\(/);
    });
});
