import logger from '../utils/logger.js';

export class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.message = err.message || 'Internal Server Error';

  if (err.name === 'JsonWebTokenError') {
    err.statusCode = 401;
    err.message = 'Invalid token';
  }

  if (err.name === 'TokenExpiredError') {
    err.statusCode = 401;
    err.message = 'Token expired';
  }

  if (err.code === 'ER_DUP_ENTRY') {
    err.statusCode = 400;
    err.message = 'Email already exists';
  }

  if (err.code === 'ER_BAD_FIELD_ERROR') {
    err.statusCode = 400;
    err.message = 'Invalid field in request';
  }

  if (err.code === 'ER_NO_REFERENCED_ROW' || err.code === 'ER_NO_REFERENCED_ROW_2') {
    err.statusCode = 400;
    err.message = 'Referenced record not found';
  }

  if (err.code && err.code.startsWith('ER_')) {
    err.statusCode = 500;
    err.message = 'Database error occurred';
    logger.error(`Database error ${err.code}: ${err.message}`, err);
  }

  if (err.message && err.message.includes('CORS')) {
    err.statusCode = 403;
    err.message = 'CORS policy violation';
  }

  logger.error(`[${new Date().toISOString()}] ${err.statusCode} ${err.message}`, {
    path: req.path,
    method: req.method,
    userId: req.user?.userId || 'anonymous',
    error: err.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });

  res.status(err.statusCode).json({
    success: false,
    message: err.message,
    statusCode: err.statusCode,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};
