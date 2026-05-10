const MzcrAccreditationOrganizationMatch = require('@core/mzcrAccreditations/domain/MzcrAccreditationOrganizationMatch');
const MzcrAccreditationSyncPlan = require('@core/mzcrAccreditations/domain/MzcrAccreditationSyncPlan');

const DEFAULT_EXPIRED_RUN_TTL_MS = 2 * 60 * 60 * 1000;
const DEFAULT_WORKPLACE_CONCURRENCY = 5;

const toIntegerOrNull = (value) => {
    if (value === null || value === undefined || value === '') {
        return null;
    }

    const parsed = Number(value);
    return Number.isInteger(parsed) ? parsed : null;
};

const mapWithConcurrency = async (items, concurrency, mapper) => {
    const results = new Array(items.length);
    let cursor = 0;

    const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
        while (cursor < items.length) {
            const currentIndex = cursor;
            cursor += 1;
            results[currentIndex] = await mapper(items[currentIndex], currentIndex);
        }
    });

    await Promise.all(workers);
    return results;
};

const collectCatalogs = async ({ sourcePort, catalogs }) => {
    const entries = await Promise.all(
        catalogs.map(async (catalog) => [catalog, await sourcePort.fetchCatalog({ catalog })])
    );

    return Object.fromEntries(entries);
};

const collectAccreditations = async ({ sourcePort, targetIco, categories }) => {
    const byId = new Map();

    for (const category of categories) {
        const rows = await sourcePort.fetchAccreditations({ category, targetIco });

        for (const row of rows || []) {
            const id = toIntegerOrNull(row?.id_akreditace);
            if (id === null) {
                continue;
            }

            const existing = byId.get(id);
            if (existing) {
                existing.sourceCategoryCodes.add(category);
                continue;
            }

            byId.set(id, {
                ...row,
                sourceCategoryCodes: new Set([category])
            });
        }
    }

    return [...byId.values()].map((row) => ({
        ...row,
        sourceCategoryCodes: [...row.sourceCategoryCodes].sort()
    }));
};

const collectAccreditationsWithOrganizations = async ({
    sourcePort,
    storePort,
    accreditations,
    concurrency
}) => {
    const workplaceIds = [
        ...new Set(accreditations
            .map((row) => toIntegerOrNull(row.pracoviste_id))
            .filter((id) => id !== null))
    ].sort((left, right) => left - right);

    const workplaceResults = await mapWithConcurrency(
        workplaceIds,
        concurrency,
        async (workplaceId) => ({
            workplaceId,
            workplace: await sourcePort.fetchWorkplace({ workplaceId })
        })
    );

    const workplaceSeatLocations = new Map();
    const seatLocations = new Set();
    for (const result of workplaceResults) {
        const match = MzcrAccreditationOrganizationMatch.create({
            city: result.workplace?.city
        });
        workplaceSeatLocations.set(result.workplaceId, match.seatLocation);
        if (match.seatLocation) {
            seatLocations.add(match.seatLocation);
        }
    }

    const organizations = seatLocations.size > 0
        ? await storePort.findOrganizationsBySeatLocations({
            seatLocations: [...seatLocations].sort()
        })
        : [];
    const organizationIdsBySeatLocation = new Map(
        (organizations || []).map((organization) => [
            organization.seatLocation || organization.seat_location,
            organization.id
        ])
    );

    return accreditations.map((row) => {
        const workplaceId = toIntegerOrNull(row.pracoviste_id);
        const seatLocation = workplaceId === null ? null : workplaceSeatLocations.get(workplaceId);

        return {
            ...row,
            organization_id: seatLocation
                ? organizationIdsBySeatLocation.get(seatLocation) || null
                : null
        };
    });
};

const buildSummary = ({ catalogs, accreditations, plan }) => ({
    catalogsCount: plan.catalogs.reduce((total, catalog) => total + (catalogs[catalog]?.length || 0), 0),
    accreditationsCount: accreditations.length
});

module.exports = ({
    mzcrAccreditationSourcePort,
    mzcrAccreditationStorePort
}, options = {}) => {
    const now = options.now || (() => new Date());
    const expiredRunTtlMs = options.expiredRunTtlMs || DEFAULT_EXPIRED_RUN_TTL_MS;
    const workplaceConcurrency = options.workplaceConcurrency || DEFAULT_WORKPLACE_CONCURRENCY;

    return async () => {
        const plan = MzcrAccreditationSyncPlan.create();
        const startedAt = now();
        const staleStartedBefore = new Date(startedAt.getTime() - expiredRunTtlMs);

        await mzcrAccreditationStorePort.markExpiredRunningRuns({
            staleStartedBefore,
            failedAt: startedAt
        });

        const run = await mzcrAccreditationStorePort.startSyncRun({
            startedAt
        });

        try {
            const catalogs = await collectCatalogs({
                sourcePort: mzcrAccreditationSourcePort,
                catalogs: plan.catalogs
            });
            const accreditations = await collectAccreditations({
                sourcePort: mzcrAccreditationSourcePort,
                targetIco: plan.targetIco,
                categories: plan.accreditationCategories
            });
            const accreditationsWithOrganizations = await collectAccreditationsWithOrganizations({
                sourcePort: mzcrAccreditationSourcePort,
                storePort: mzcrAccreditationStorePort,
                accreditations,
                concurrency: workplaceConcurrency
            });
            const syncedAt = now();
            const summary = buildSummary({
                catalogs,
                accreditations: accreditationsWithOrganizations,
                plan
            });

            return mzcrAccreditationStorePort.commitSuccessfulSync({
                runId: run.id,
                syncedAt,
                catalogs,
                accreditations: accreditationsWithOrganizations,
                summary
            });
        } catch (error) {
            await mzcrAccreditationStorePort.failSyncRun({
                runId: run.id,
                failedAt: now(),
                errorMessage: error?.message || 'MZCR accreditation sync failed'
            });
            throw error;
        }
    };
};
