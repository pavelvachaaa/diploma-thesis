const { startRequestContext } = require('@shared/requestContext');

const requestContextMiddleware = (req, res, next) => {
    startRequestContext(req, res, next);
};

module.exports = {
    requestContextMiddleware
};
