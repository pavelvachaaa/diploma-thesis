const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '../..');

describe('architecture documentation drift guardrails', () => {
    it('keeps agent docs aligned with the module-first runtime shape', () => {
        const files = [

        ];

        const bannedPhrases = [
            'maintain the layered architecture',
            'src/services/audit.service.js',
            'src/repositories/audit.repository.js',
            'Located in `src/repositories/chat.repository.js`',
            'Located in `src/services/chat.service.js`',
            'Located in `src/controllers/chat.controller.js`',
            'src/services/cv_analysis_consumer.service.js',
            'always use `req.organizationId` on the request object'
        ];

        const violations = [];

        for (const file of files) {
            const content = fs.readFileSync(file, 'utf8');
            for (const phrase of bannedPhrases) {
                if (content.includes(phrase)) {
                    violations.push(`${path.basename(file)} -> ${phrase}`);
                }
            }
        }

        expect(violations).toEqual([]);
    });
});
