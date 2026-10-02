const sendResponse = require('../utils/response');

module.exports = (req, res, next) => {
    if (req.auth?.role !== 'ADMIN') {
        return sendResponse(res, 403, 'Administrator access required', null);
    }

    return next();
};
