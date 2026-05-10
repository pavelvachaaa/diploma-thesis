#!/usr/bin/env node

/* eslint-disable no-console */
const fs = require('node:fs');
const path = require('node:path');
const dotenv = require('dotenv');

const loadEnv = () => {
    if (process.env.POSTGRES_HOST && process.env.POSTGRES_USER && process.env.POSTGRES_DB) {
        return;
    }

    const cwd = process.cwd();
    const preferred = process.env.NODE_ENV === 'production' ? '.env' : '.env.local';
    const candidates = [preferred, '.env.local', '.env'];

    for (const fileName of candidates) {
        const filePath = path.join(cwd, fileName);
        if (fs.existsSync(filePath)) {
            dotenv.config({ path: filePath, override: false });
            return;
        }
    }
};

const main = async () => {
    loadEnv();
    require('module-alias/register');

    const container = require('@/container');
    const application = container.resolve('mzcrAccreditationsApplication');
    const result = await application.syncMzcrAccreditations();

    console.log(JSON.stringify(result, null, 2));
};

main().catch((error) => {
    console.error('MZCR accreditation sync failed');
    console.error(error);
    process.exit(1);
});
