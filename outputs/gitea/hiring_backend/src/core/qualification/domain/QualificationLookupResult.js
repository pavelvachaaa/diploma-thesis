const freezeObject = (value) => {
    if (!value || typeof value !== 'object') {
        return value;
    }

    if (Array.isArray(value)) {
        return Object.freeze(value.map((entry) => freezeObject(entry)));
    }

    const entries = Object.entries(value).map(([key, entry]) => [key, freezeObject(entry)]);
    return Object.freeze(Object.fromEntries(entries));
};

const toCount = (value, fallback = 0) => {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
        return parsed;
    }

    return fallback;
};

const mapWorker = (worker) => {
    if (!worker || typeof worker !== 'object' || Array.isArray(worker)) {
        return null;
    }

    return freezeObject({
        nrzpCislo: worker.nrzpCislo ?? null,
        jmeno: worker.jmeno ?? null,
        prijmeni: worker.prijmeni ?? null,
        datumNarozeni: worker.datumNarozeni ?? null,
        statniObcanstvi: worker.statniObcanstvi ?? null
    });
};

const mapWorkerList = (workers) => {
    if (!Array.isArray(workers)) {
        return Object.freeze([]);
    }

    return Object.freeze(
        workers
            .map((worker) => mapWorker(worker))
            .filter(Boolean)
    );
};

const mapQualificationItem = (item) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
        return null;
    }

    return freezeObject({
        nrzpCislo: item.nrzpCislo ?? null,
        typZpusobilosti: item.typZpusobilosti ?? null,
        obor: item.obor ?? null,
        odbornost: item.odbornost ?? null
    });
};

const mapQualificationList = (items) => {
    if (!Array.isArray(items)) {
        return Object.freeze([]);
    }

    return Object.freeze(
        items
            .map((item) => mapQualificationItem(item))
            .filter(Boolean)
    );
};

const create = ({ request, providerResult = {} } = {}) => {
    const worker = mapWorker(providerResult.worker);
    const workers = mapWorkerList(providerResult.workers);
    const qualifications = freezeObject({
        odborneZpusobilosti: mapQualificationList(providerResult?.qualifications?.odborneZpusobilosti),
        specializovaneZpusobilosti: mapQualificationList(providerResult?.qualifications?.specializovaneZpusobilosti),
        zvlastniOdborneZpusobilosti: mapQualificationList(providerResult?.qualifications?.zvlastniOdborneZpusobilosti)
    });

    const counts = freezeObject({
        workers: toCount(providerResult?.counts?.workers, workers.length),
        odborneZpusobilosti: toCount(
            providerResult?.counts?.odborneZpusobilosti,
            qualifications.odborneZpusobilosti.length
        ),
        specializovaneZpusobilosti: toCount(
            providerResult?.counts?.specializovaneZpusobilosti,
            qualifications.specializovaneZpusobilosti.length
        ),
        zvlastniOdborneZpusobilosti: toCount(
            providerResult?.counts?.zvlastniOdborneZpusobilosti,
            qualifications.zvlastniOdborneZpusobilosti.length
        )
    });

    const upstream = freezeObject({
        status: providerResult?.upstream?.status ?? null,
        success: providerResult?.upstream?.success ?? null,
        stav: providerResult?.upstream?.stav ?? null,
        message: providerResult?.upstream?.message ?? null,
        error: providerResult?.upstream?.error ?? null,
        operation: providerResult?.upstream?.operation ?? null
    });

    return freezeObject({
        searchType: request?.searchType || null,
        queryMasked: request?.queryMasked || null,
        applicantId: request?.applicantId || null,
        worker,
        workers,
        qualifications,
        counts,
        upstream
    });
};

module.exports = {
    create
};
