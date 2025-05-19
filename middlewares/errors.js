const ErrorHandler = require('../utils/errorHandler');

module.exports = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;

    if (process.env.NODE_ENV === 'development') {
        return res.status(err.statusCode).json({
            success: false,
            error: err,
            errMessage: err.message,
            stack: err.stack,
        });
    }

    if (process.env.NODE_ENV === 'production') {
        let error = { ...err };
        error.message = err.message;

        if (err.name === 'JsonWebTokenError') {
            const message = `Invalid token. Please log in again.`;
            error = new ErrorHandler(message, 401);
        }

        if (err.name === 'TokenExpiredError') {
            const message = `Your token has expired. Please log in again.`;
            error = new ErrorHandler(message, 401);
        }

        if (err.name === 'NotBeforeError') {
            const message = `Token not active yet. Try again shortly.`;
            error = new ErrorHandler(message, 401);
        }

        return res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || 'Internal Server Error',
        });
    }

    
    return res.status(err.statusCode).json({
        success: false,
        message: err.message || 'Something went wrong',
    });
};
