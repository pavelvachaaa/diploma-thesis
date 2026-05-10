module.exports = ({ sideEffectOutboxRepository, logger, audit }) => {
    const parseIntEnv = (name, fallback) => {
        const parsed = Number(process.env[name] || fallback);
        return Number.isFinite(parsed) && parsed > 0 ? Math.trunc(parsed) : fallback;
    };

    const getReplayMaxExecute = () => parseIntEnv('OUTBOX_REPLAY_MAX_EXECUTE', 100);

    const normalizeSelection = (selection = {}) => ({
        ids: Array.isArray(selection.ids)
            ? selection.ids.map((id) => String(id).trim()).filter(Boolean)
            : [],
        eventType: selection.eventType ? String(selection.eventType).trim() : null,
        limit: selection.limit
    });

    const inspectSummary = async (filters = {}) => {
        return sideEffectOutboxRepository.inspectSummary({
            status: filters.status ? String(filters.status).trim() : null,
            eventType: filters.eventType ? String(filters.eventType).trim() : null
        });
    };

    const listEvents = async (filters = {}) => {
        return sideEffectOutboxRepository.listEvents({
            page: filters.page,
            limit: filters.limit,
            status: filters.status ? String(filters.status).trim() : null,
            eventType: filters.eventType ? String(filters.eventType).trim() : null
        });
    };

    const buildReplayMetadata = ({ mode, selection, result }) => {
        return {
            mode,
            selector: {
                idsCount: selection.ids.length,
                eventType: selection.eventType,
                limit: selection.limit
            },
            matchedCount: result.matchedCount,
            replayedCount: result.replayedCount,
            affectedIdsSample: Array.isArray(result.events)
                ? result.events
                    .map((event) => event.id)
                    .filter(Boolean)
                    .slice(0, 25)
                : []
        };
    };

    const emitReplayAudit = async ({ mode, status, selection, result, options = {}, errorMessage = null }) => {
        try {
            await audit.writeAuditEvent({
                category: 'side_effect',
                action: 'side_effect.outbox.replay',
                status,
                source: options.source || 'api',
                actorUserId: options.actorUserId || null,
                actorEmail: options.actorEmail || null,
                actorRoles: options.actorRoles || null,
                organizationId: options.organizationId || null,
                resourceType: 'side_effect_outbox',
                metadata: buildReplayMetadata({ mode, selection, result }),
                errorMessage
            });
        } catch (error) {
            logger.warn('Failed to emit side effect outbox replay audit event', {
                error: error.message
            });
        }
    };

    const previewReplayDead = async (selection = {}, options = {}) => {
        const normalizedSelection = normalizeSelection(selection);
        const rows = await sideEffectOutboxRepository.previewReplayDead(normalizedSelection);
        const result = {
            mode: 'preview',
            selection: normalizedSelection,
            matchedCount: rows.length,
            replayedCount: 0,
            events: rows
        };

        await emitReplayAudit({
            mode: 'preview',
            status: 'success',
            selection: normalizedSelection,
            result,
            options
        });

        return result;
    };

    const replayDead = async (selection = {}, options = {}) => {
        const normalizedSelection = normalizeSelection(selection);
        const replayMaxExecute = getReplayMaxExecute();

        if (normalizedSelection.ids.length > replayMaxExecute) {
            throw new Error(`Replay execute ids limit exceeded (${normalizedSelection.ids.length} > ${replayMaxExecute})`);
        }

        if (normalizedSelection.ids.length === 0 && normalizedSelection.limit) {
            const parsedLimit = Number(normalizedSelection.limit);
            if (Number.isFinite(parsedLimit) && parsedLimit > replayMaxExecute) {
                throw new Error(`Replay execute limit exceeded (${parsedLimit} > ${replayMaxExecute})`);
            }
        }

        try {
            const replayResult = await sideEffectOutboxRepository.replayDead(normalizedSelection);
            const result = {
                mode: 'execute',
                selection: normalizedSelection,
                matchedCount: replayResult.matchedCount,
                replayedCount: replayResult.replayedCount,
                events: replayResult.events
            };

            await emitReplayAudit({
                mode: 'execute',
                status: 'success',
                selection: normalizedSelection,
                result,
                options
            });

            return result;
        } catch (error) {
            await emitReplayAudit({
                mode: 'execute',
                status: 'failure',
                selection: normalizedSelection,
                result: {
                    matchedCount: 0,
                    replayedCount: 0
                },
                options,
                errorMessage: error.message
            });
            throw error;
        }
    };

    return {
        inspectSummary,
        listEvents,
        previewReplayDead,
        replayDead
    };
};
