const { handle, sendResult } = require('@shared/http/controller');
const {
    toExtractJobInput,
    toRefineTextInput,
    toStreamChatInput
} = require('./jobChat.mapper');

module.exports = ({ aiJobChatApplication, logger }) => {
    const writeSseHeaders = (res) => {
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('X-Accel-Buffering', 'no');
        res.flushHeaders();
    };

    const createStreamCallbacks = (res, errorLabel) => ({
        onEvent(type, data) {
            res.write(`event: ${type}\ndata: ${JSON.stringify(data)}\n\n`);
        },
        onEnd() {
            res.write('event: done\ndata: {}\n\n');
            res.end();
        },
        onError(error) {
            logger.error(errorLabel, { error: error.message });
            res.write(`event: error\ndata: ${JSON.stringify({ error: error.message })}\n\n`);
            res.end();
        }
    });

    const streamChat = handle(async (req, res) => {
        const input = toStreamChatInput(req.body, req.user);

        writeSseHeaders(res);

        const abortController = new AbortController();
        req.on('close', () => {
            abortController.abort();
        });

        try {
            await aiJobChatApplication.streamChat(
                input,
                createStreamCallbacks(res, 'AI job chat stream error'),
                { signal: abortController.signal }
            );
        } catch (error) {
            if (res.headersSent) {
                logger.error('AI job chat error after headers sent', { error: error.message });
                res.end();
                return;
            }

            throw error;
        }
    });

    const refineText = handle(async (req, res) => {
        const input = toRefineTextInput(req.body);

        writeSseHeaders(res);

        const abortController = new AbortController();
        req.on('close', () => {
            abortController.abort();
        });

        try {
            await aiJobChatApplication.refineText(
                input,
                createStreamCallbacks(res, 'AI refine stream error'),
                { signal: abortController.signal }
            );
        } catch (error) {
            if (res.headersSent) {
                logger.error('AI refine error after headers sent', { error: error.message });
                res.end();
                return;
            }

            throw error;
        }
    });

    const extractJob = handle(async (req, res) => sendResult(
        res,
        await aiJobChatApplication.extractJob(toExtractJobInput(req.body, req.user))
    ));

    return {
        streamChat,
        refineText,
        extractJob
    };
};
