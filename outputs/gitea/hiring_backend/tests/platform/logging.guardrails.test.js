const fs = require('fs');
const path = require('path');

describe('logging guardrails', () => {
    const read = (relativePath) => fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');

    it('keeps db logging free of raw SQL text/params and lastQuery logs', () => {
        const source = read('src/platform/db/index.js');

        expect(source).not.toContain('logger.debug(params)');
        expect(source).not.toContain('lastQuery');
        expect(source).not.toContain('Executed query ${text}');
    });

    it('prevents auth token payload logging', () => {
        const authController = read('src/adapters/in/http/auth/controller.js');
        const authService = read('src/core/auth/application/oauth.js');

        expect(authController).not.toContain('{ tokenData }');
        expect(authService).not.toContain('Successfully got UCP employee data:');
        expect(authService).not.toContain('Using fallback user data:');
    });

    it('prevents raw logger.error(error) pattern in high-risk modules', () => {
        const emailOutbox = read('src/adapters/out/integration/email/outbox.js');
        expect(emailOutbox).not.toContain('logger.error(error);');
    });
});
