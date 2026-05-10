const fs = require('node:fs');
const path = require('node:path');

const ROOT_DIR = path.join(__dirname, '../..');
const PILOT_CONTROLLERS = [
    'src/domain/interviews/controller/lifecycle.js',
    'src/domain/workflows/controller/workflows.controller.js',
    'src/adapters/in/http/organizations/controller.js'
];

const readSource = (relativePath) => fs.readFileSync(path.join(ROOT_DIR, relativePath), 'utf8');

describe('architecture: pilot controllers use shared validation helpers', () => {
    it('does not import express-validator validationResult directly', () => {
        const violations = PILOT_CONTROLLERS.filter((relativePath) => {
            const source = readSource(relativePath);
            return /\bvalidationResult\b/.test(source);
        });

        expect(violations).toEqual([]);
    });

    it('imports and uses ensureRequestValid from the shared validation helper', () => {
        const violations = PILOT_CONTROLLERS.filter((relativePath) => {
            const source = readSource(relativePath);
            return !source.includes("@shared/http/validation")
                || !/\bensureRequestValid\s*\(/.test(source);
        });

        expect(violations).toEqual([]);
    });
});
