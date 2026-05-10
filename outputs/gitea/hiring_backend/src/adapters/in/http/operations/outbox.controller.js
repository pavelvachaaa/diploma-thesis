const { handle, sendResult } = require('@shared/http/controller');
const {
    toActorOptions,
    toOutboxFilters,
    toOutboxSummaryFilters,
    toReplaySelection
} = require('./outbox.mapper');

module.exports = ({ operationsOutboxApplication }) => ({
    getSummary: handle(async (req, res) => sendResult(
        res,
        await operationsOutboxApplication.getSummary(toOutboxSummaryFilters(req.query))
    )),

    getEvents: handle(async (req, res) => sendResult(
        res,
        await operationsOutboxApplication.getEvents(toOutboxFilters(req.query))
    )),

    replayDead: handle(async (req, res) => sendResult(
        res,
        await operationsOutboxApplication.replayDead(
            toReplaySelection(req.body),
            toActorOptions(req.user)
        )
    ))
});
