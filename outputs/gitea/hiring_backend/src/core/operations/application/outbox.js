const OutboxAlertPolicy = require('@core/operations/domain/OutboxAlertPolicy');
const {
    normalizeOutboxEventFilters,
    normalizeOutboxSummaryFilters,
    normalizeReplaySelection
} = require('@core/operations/application/queryOptions');

module.exports = ({
    operationsOutboxGatewayPort,
    operationsOutboxAlertConfigPort
}) => {
    const getSummary = async (filters = {}) => {
        const snapshot = await operationsOutboxGatewayPort.inspectSummary(normalizeOutboxSummaryFilters(filters));
        const thresholds = await operationsOutboxAlertConfigPort.getAlertThresholds();

        return {
            ...snapshot,
            breachFlags: OutboxAlertPolicy.evaluate(snapshot, thresholds)
        };
    };

    const getEvents = (filters = {}) => operationsOutboxGatewayPort.listEvents(
        normalizeOutboxEventFilters(filters)
    );

    const replayDead = (selection = {}, options = {}) => {
        const normalizedSelection = normalizeReplaySelection(selection);
        const replaySelection = {
            ids: normalizedSelection.ids,
            eventType: normalizedSelection.eventType,
            limit: normalizedSelection.limit
        };

        return normalizedSelection.execute
            ? operationsOutboxGatewayPort.replayDead(replaySelection, options)
            : operationsOutboxGatewayPort.previewReplayDead(replaySelection, options);
    };

    return {
        getSummary,
        getEvents,
        replayDead
    };
};
