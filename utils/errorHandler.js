const errorHandler = (err, req, res, next) => {
    console.error(err);

    let code = err.statusCode || 500;
    let message = err.message || 'Internal server error';

    // MongoDB duplicate key error
    if (err.code === 11000) {
        code = 409;

        const field = Object.keys(err.keyPattern || {})[0];

        message = `${field || 'Field'} already exists`;
    }

    // Invalid MongoDB ObjectId
    if (err.name === 'CastError') {
        code = 400;
        message = 'Invalid ID';
    }

    // Mongoose validation error
    if (err.name === 'ValidationError') {
        code = 400;

        const errors = Object.values(err.errors).map(error => ({
            field: error.path,
            message: error.message
        }));

        return res.status(code).json({
            code,
            success: false,
            message: 'Validation failed',
            data: null,
            errors
        });
    }

    return res.status(code).json({
        code,
        success: false,
        message,
        data: null
    });
};

module.exports = errorHandler;