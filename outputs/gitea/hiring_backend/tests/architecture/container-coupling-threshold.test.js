const { execFileSync } = require('node:child_process');
const path = require('node:path');

describe('architecture: container coupling threshold', () => {
    it('passes coupling threshold checks for current container graph', () => {
        const root = path.join(__dirname, '../..');
        expect(() => {
            execFileSync('node', ['scripts/check-container-coupling.js'], {
                cwd: root,
                stdio: 'pipe',
                env: {
                    ...process.env,
                    ARCH_MAX_SERVICE_TOTAL_DEPS: '9',
                    ARCH_MAX_SERVICE_SERVICE_DEPS: '0'
                }
            });
        }).not.toThrow();
    });
});
