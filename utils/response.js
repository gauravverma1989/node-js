const sendResponse = (res, code, message, data = null) => {
    return res.status(code).json({
        code,
        success: code >= 200 && code < 300,
        message,
        data
    });
};

module.exports = sendResponse;