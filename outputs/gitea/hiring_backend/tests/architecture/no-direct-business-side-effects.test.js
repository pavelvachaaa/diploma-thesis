const fs = require('node:fs');
const path = require('node:path');

const SRC_DIR = path.join(__dirname, '../../src');

const ALLOWED_PATH_PREFIXES = [
    path.join(SRC_DIR, 'platform/outbox/handlers.js'),
    path.join(SRC_DIR, 'platform/outbox/handlers')
];

const FORBIDDEN_PATTERNS = [
    { label: 'mailer.sendEmail', regex: /mailer\.sendEmail\s*\(/ },
    { label: 'mailer.sendWelcomeEmail', regex: /mailer\.sendWelcomeEmail\s*\(/ },
    { label: 'notificationService.notifyRoleInOrg', regex: /notificationService\.notifyRoleInOrg\s*\(/ },
    { label: 'notificationService.notifyUser', regex: /notificationService\.notifyUser\s*\(/ },
    { label: 'rabbitmqService.publishCVEventConfirmed', regex: /rabbitmqService\.publishCVEventConfirmed\s*\(/ },
    { label: 'rabbitmqService.publishJobSeekerCVEventConfirmed', regex: /rabbitmqService\.publishJobSeekerCVEventConfirmed\s*\(/ },
    { label: 'rabbitmqService.publishJobEmbeddingRequestConfirmed', regex: /rabbitmqService\.publishJobEmbeddingRequestConfirmed\s*\(/ },
    { label: 'storageService.delete', regex: /storageService\.delete\s*\(/ }
];

const collectJsFiles = (directory) => {
    const result = [];
    const entries = fs.readdirSync(directory, { withFileTypes: true });

    for (const entry of entries) {
        const absolute = path.join(directory, entry.name);
        if (entry.isDirectory()) {
            result.push(...collectJsFiles(absolute));
            continue;
        }

        if (entry.isFile() && absolute.endsWith('.js')) {
            result.push(absolute);
        }
    }

    return result;
};

const isAllowedPath = (filePath) => {
    return ALLOWED_PATH_PREFIXES.some((prefix) => filePath === prefix || filePath.startsWith(`${prefix}${path.sep}`));
};

describe('business side effects must be routed through outbox handlers', () => {
    it('does not use direct business side-effect adapters outside outbox handlers', () => {
        const files = collectJsFiles(SRC_DIR);
        const violations = [];

        for (const filePath of files) {
            if (isAllowedPath(filePath)) {
                continue;
            }

            const contents = fs.readFileSync(filePath, 'utf8');
            for (const pattern of FORBIDDEN_PATTERNS) {
                if (pattern.regex.test(contents)) {
                    violations.push({
                        file: path.relative(SRC_DIR, filePath),
                        pattern: pattern.label
                    });
                }
            }
        }

        expect(violations).toEqual([]);
    });
});
