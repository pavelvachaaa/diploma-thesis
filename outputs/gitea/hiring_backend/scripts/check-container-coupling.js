#!/usr/bin/env node

/* eslint-disable no-console */
const fs = require('node:fs');
const path = require('node:path');
const { execSync } = require('node:child_process');

const ROOT = process.cwd();
const REPORT_PATH = path.join(ROOT, 'reports', 'container-graph', 'services.json');

const toInt = (value, fallback) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? Math.trunc(parsed) : fallback;
};

const parseAllowList = () => {
    const value = process.env.ARCH_COUPLING_ALLOWLIST || '';
    return new Set(
        value
            .split(',')
            .map((token) => token.trim())
            .filter(Boolean)
    );
};

const HOTSPOT_SERVICE_DEP_LIMITS = Object.freeze({
    employeesService: 0,
    calendarService: 0,
    applicantsService: 0,
    documentsService: 0,
    jobsService: 0
});

const ensureGraphReport = () => {
    execSync('node scripts/export-container-graph.js', {
        cwd: ROOT,
        stdio: 'pipe'
    });
};

const isTempAllowlisted = (token) => {
    return false;
};

const main = () => {
    ensureGraphReport();

    if (!fs.existsSync(REPORT_PATH)) {
        console.error('Container graph report was not generated.');
        process.exit(1);
    }

    const payload = JSON.parse(fs.readFileSync(REPORT_PATH, 'utf8'));
    const services = Array.isArray(payload.services) ? payload.services : [];
    const maxTotalDeps = toInt(process.env.ARCH_MAX_SERVICE_TOTAL_DEPS, 9);
    const maxServiceDeps = toInt(process.env.ARCH_MAX_SERVICE_SERVICE_DEPS, 0);
    const allowList = parseAllowList();

    const violations = [];

    for (const service of services) {
        const deps = service.dependencies || {};
        const serviceDeps = Array.isArray(deps.services) ? deps.services.length : 0;
        const repositoryDeps = Array.isArray(deps.repositories) ? deps.repositories.length : 0;
        const infraDeps = Array.isArray(deps.infra) ? deps.infra.length : 0;
        const portDeps = Array.isArray(deps.ports) ? deps.ports.length : 0;
        const totalDeps = serviceDeps + repositoryDeps + infraDeps + portDeps;

        const allowlisted = allowList.has(service.token) || isTempAllowlisted(service.token);

        if (!allowlisted && totalDeps > maxTotalDeps) {
            violations.push({
                type: 'max-total-deps',
                token: service.token,
                totalDeps,
                maxTotalDeps
            });
        }

        if (!allowlisted && serviceDeps > maxServiceDeps) {
            violations.push({
                type: 'max-service-deps',
                token: service.token,
                serviceDeps,
                maxServiceDeps
            });
        }

        const hotspotLimit = HOTSPOT_SERVICE_DEP_LIMITS[service.token];
        if (
            Number.isFinite(hotspotLimit)
            && !allowlisted
            && serviceDeps > hotspotLimit
        ) {
            violations.push({
                type: 'hotspot-service-deps',
                token: service.token,
                serviceDeps,
                maxServiceDeps: hotspotLimit
            });
        }
    }

    if (violations.length > 0) {
        console.error('Container coupling threshold violations detected:');
        for (const violation of violations) {
            if (violation.type === 'max-total-deps') {
                console.error(
                    ` - [${violation.type}] ${violation.token}: ${violation.totalDeps} > ${violation.maxTotalDeps}`
                );
                continue;
            }

            console.error(
                ` - [${violation.type}] ${violation.token}: ${violation.serviceDeps} > ${violation.maxServiceDeps}`
            );
        }
        process.exit(1);
    }

    console.log(
        `Container coupling checks passed (services=${services.length}, maxTotalDeps=${maxTotalDeps}, maxServiceDeps=${maxServiceDeps}).`
    );
};

main();
