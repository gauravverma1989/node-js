const sendResponse = (res, code, message, data = null, pagination = undefined, extraFields = undefined) => {
    const response = {
        code,
        success: code >= 200 && code < 300,
        message,
        data
    };

    if (pagination !== undefined) {
        response.pagination = pagination;
    }

    if (extraFields !== undefined) {
        Object.assign(response, extraFields);
    }

    return res.status(code).json(response);
};

module.exports = sendResponse;
