const LEGACY_EVENT_ALIASES = {
    'email.welcome': 'email.welcome.v1',
    'email.raw': 'email.raw.v1',
    'notification.role': 'notification.role.v1',
    'notification.user': 'notification.user.v1',
    'cv.uploaded': 'cv.publish.applicant.v1',
    'job_seeker_cv.uploaded': 'cv.publish.job_seeker.v1',
    'job.embedding.requested': 'job.embedding.requested.v1',
    'file.gc.delete': 'file.gc.delete.v1',
    'rebac.user_role.sync': 'rebac.user_role.sync.v1',
    'rebac.membership.sync': 'rebac.membership.sync.v1',
    'rebac.membership.delete': 'rebac.membership.delete.v1',
    'rebac.job_posting.sync': 'rebac.job_posting.sync.v1',
    'rebac.organization.sync': 'rebac.organization.sync.v1'
};

module.exports = ({ config, eventTypes }) => {
    const normalizeEventType = (value) => String(value || '')
        .replace(/[\u0000-\u001f]/g, '')
        .replace(/^["'`]+|["'`]+$/g, '')
        .trim()
        .toLowerCase();

    const normalizeErrorCode = (value) => {
        const raw = String(value || 'SIDE_EFFECT_OUTBOX_DISPATCH_FAILED')
            .replace(/[^a-zA-Z0-9]+/g, '_')
            .replace(/^_+|_+$/g, '')
            .toUpperCase();
        return raw || 'SIDE_EFFECT_OUTBOX_DISPATCH_FAILED';
    };

    const defaultPolicy = {
        maxAttempts: config.getMaxAttempts(),
        retryBaseMs: config.getRetryBaseMs(),
        retryMaxMs: config.getRetryMaxMs()
    };

    const policyByEventType = {
        [eventTypes.WELCOME_EMAIL]: { ...defaultPolicy },
        [eventTypes.RAW_EMAIL]: { ...defaultPolicy },
        [eventTypes.ROLE_NOTIFICATION]: { ...defaultPolicy },
        [eventTypes.USER_NOTIFICATION]: { ...defaultPolicy },
        [eventTypes.CV_PUBLISH_APPLICANT]: { ...defaultPolicy },
        [eventTypes.CV_PUBLISH_JOB_SEEKER]: { ...defaultPolicy },
        [eventTypes.JOB_EMBEDDING_REQUESTED]: { ...defaultPolicy },
        [eventTypes.FILE_GC_DELETE]: { ...defaultPolicy },
        [eventTypes.REBAC_USER_ROLE_SYNC]: { ...defaultPolicy },
        [eventTypes.REBAC_MEMBERSHIP_SYNC]: { ...defaultPolicy },
        [eventTypes.REBAC_MEMBERSHIP_DELETE]: { ...defaultPolicy },
        [eventTypes.REBAC_JOB_POSTING_SYNC]: { ...defaultPolicy },
        [eventTypes.REBAC_ORGANIZATION_SYNC]: { ...defaultPolicy }
    };

    for (const [legacy, canonical] of Object.entries(LEGACY_EVENT_ALIASES)) {
        policyByEventType[legacy] = policyByEventType[canonical] || { ...defaultPolicy };
    }

    const computeRetryDelayMs = ({ attempts, retryBaseMs, retryMaxMs }) => {
        const exponent = Math.max(0, (attempts || 1) - 1);
        return Math.min(retryMaxMs, retryBaseMs * (2 ** exponent));
    };

    const getRetryPolicy = ({ eventType, eventMaxAttempts = null }) => {
        const normalizedEventType = normalizeEventType(eventType);
        const base = policyByEventType[normalizedEventType] || defaultPolicy;
        const maxAttempts = Number.isFinite(Number(eventMaxAttempts)) && Number(eventMaxAttempts) > 0
            ? Number(eventMaxAttempts)
            : base.maxAttempts;

        return {
            eventType: normalizedEventType,
            maxAttempts,
            retryBaseMs: base.retryBaseMs,
            retryMaxMs: base.retryMaxMs
        };
    };

    const classifyFailure = ({ error, attempts, maxAttempts, retryPolicy }) => {
        const permanent = error?.isPermanent === true;
        const exhausted = attempts >= maxAttempts;
        const errorCode = normalizeErrorCode(error?.code);

        if (permanent || exhausted) {
            return {
                outcome: 'dead',
                classification: permanent ? 'permanent' : 'max_attempts',
                errorCode,
                retryDelayMs: null,
                nextAvailableAt: null
            };
        }

        const retryDelayMs = computeRetryDelayMs({
            attempts,
            retryBaseMs: retryPolicy.retryBaseMs,
            retryMaxMs: retryPolicy.retryMaxMs
        });

        return {
            outcome: 'retry',
            classification: 'transient',
            errorCode,
            retryDelayMs,
            nextAvailableAt: new Date(Date.now() + retryDelayMs)
        };
    };

    const createSentOutcome = (resultMeta = {}) => ({
        outcome: 'sent',
        classification: 'success',
        errorCode: null,
        resultMeta: resultMeta || {}
    });

    return {
        normalizeEventType,
        normalizeErrorCode,
        getRetryPolicy,
        classifyFailure,
        createSentOutcome,
        policyByEventType
    };
};
