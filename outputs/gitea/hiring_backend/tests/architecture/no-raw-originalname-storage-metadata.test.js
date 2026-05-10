const fs = require('node:fs');
const path = require('node:path');

const UPLOAD_BUILDERS_FILE = path.join(__dirname, '../../src/shared/file/uploadMiddlewareBuilders.js');

describe('architecture: upload metadata must not include raw originalName', () => {
    it('does not pass file.originalname into storage custom metadata', () => {
        const source = fs.readFileSync(UPLOAD_BUILDERS_FILE, 'utf8');
        const rawOriginalNamePattern = /custom\s*:\s*{[^}]*originalName\s*:\s*file\.originalname/s;

        expect(rawOriginalNamePattern.test(source)).toBe(false);
    });
});
