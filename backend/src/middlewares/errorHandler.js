import { ENV } from '../config/env.js';

export function notFoundHandler(req, res, next) {
  res.status(404).json({
    ok: false,
    message: `Not Found: ${req.method} ${req.originalUrl}`,
  });
}

export function errorHandler(err, req, res, next) {
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message || 'Internal Server Error';
  let errors = null;

  // Handle Mongoose duplicate key error (e.g. unique email)
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    message = `An account or record with this ${field} already exists.`;
    errors = { [field]: message };
  }

  // Handle Mongoose Validation Error
  if (err.name === 'ValidationError') {
    statusCode = 400;
    errors = {};
    for (const key in err.errors) {
      errors[key] = err.errors[key].message;
    }
    message = 'Validation failed';
  }

  // Handle Mongoose CastError (e.g. invalid ObjectId)
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid format for parameter: ${err.path}`;
  }

  if (ENV.NODE_ENV !== 'test') {
    console.error(`[Error] ${statusCode} - ${message}`, err.stack);
  }

  res.status(statusCode).json({
    ok: false,
    message,
    ...(errors ? { errors } : {}),
    ...(ENV.NODE_ENV === 'development' ? { stack: err.stack } : {}),
  });
}
