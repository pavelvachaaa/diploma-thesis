#!/usr/bin/env node

/* eslint-disable no-console */
const fs = require('node:fs');
const path = require('node:path');

require('module-alias/register');

const registry = require('@/container.registry');

const REQUIRED_DIRS = ['controller', 'service', 'repository'];
const OPTIONAL_DIRS = ['events'];

const hasJsFilesRecursively = (directory) => {
    const entries = fs.readdirSync(directory, { withFileTypes: true });

    for (const entry of entries) {
        const absolute = path.join(directory, entry.name);
        if (entry.isDirectory() && hasJsFilesRecursively(absolute)) {
            return true;
        }

        if (entry.isFile() && entry.name.endsWith('.js')) {
            return true;
        }
    }

    return false;
}
const run = () => {
    const failures = [];

    for (const moduleAliasPath of registry.domainModules || []) {
        // eslint-disable-next-line import/no-dynamic-require, global-require
        const moduleDefinition = require(moduleAliasPath);
        const basePath = moduleDefinition.basePath;
        const moduleName = moduleDefinition.name || moduleAliasPath;

        if (!basePath || !fs.existsSync(basePath)) {
            failures.push(`[${moduleName}] missing basePath: ${basePath || '<undefined>'}`);
            continue;
        }

        const indexPath = path.join(basePath, 'index.js');
        if (!fs.existsSync(indexPath)) {
            failures.push(`[${moduleName}] missing index.js`);
        }

        for (const dir of REQUIRED_DIRS) {
            const dirPath = path.join(basePath, dir);
            if (!fs.existsSync(dirPath) || !fs.statSync(dirPath).isDirectory()) {
                failures.push(`[${moduleName}] missing directory: ${dir}/`);
                continue;
            }

            if (!hasJsFilesRecursively(dirPath)) {
                failures.push(`[${moduleName}] directory has no .js files: ${dir}/`);
            }
        }

        for (const dir of OPTIONAL_DIRS) {
            const dirPath = path.join(basePath, dir);

            if (!fs.existsSync(dirPath)) {
                continue;
            }

            if (!fs.statSync(dirPath).isDirectory()) {
                failures.push(`[${moduleName}] expected directory for optional slice: ${dir}/`);
                continue;
            }

            if (!hasJsFilesRecursively(dirPath)) {
                failures.push(`[${moduleName}] optional directory has no .js files: ${dir}/`);
            }
        }
    }

    if (failures.length > 0) {
        console.error('\nDomain module shape validation failed:\n');
        for (const failure of failures) {
            console.error(`- ${failure}`);
        }
        process.exit(1);
    }

    console.log('Domain module shape validation passed.');
};

run();
