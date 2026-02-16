// backend/src/middleware/errorHandler.js
// Global error handling middleware

const { errorResponse } = require('../utils/responseHelper');

/**
 * Global error handler middleware
 * Catches all errors and sends standardized error responses
 */
const errorHandler = (err, req, res, next) => {
  // Log error for debugging
  console.error('Error:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  // Handle specific error types
  if (err.name === 'ValidationError') {
    return errorResponse(
      res,
      'Validation failed',
      400,
      err.details
    );
  }

  if (err.name === 'UnauthorizedError' || err.message === 'Unauthorized') {
    return errorResponse(
      res,
      'Authentication required',
      401
    );
  }

  if (err.name === 'ForbiddenError') {
    return errorResponse(
      res,
      'Access forbidden',
      403
    );
  }

  if (err.name === 'NotFoundError') {
    return errorResponse(
      res,
      err.message || 'Resource not found',
      404
    );
  }

  // Supabase/PostgreSQL errors
  if (err.code) {
    switch (err.code) {
      case '23505': // Unique violation
        return errorResponse(
          res,
          'Resource already exists',
          409,
          { field: err.constraint }
        );
      case '23503': // Foreign key violation
        return errorResponse(
          res,
          'Related resource not found',
          400
        );
      case '23502': // Not null violation
        return errorResponse(
          res,
          'Required field missing',
          400,
          { field: err.column }
        );
      case '23514': // Check constraint violation
        return errorResponse(
          res,
          'Invalid data provided',
          400
        );
    }
  }

  // Default server error
  return errorResponse(
    res,
    process.env.NODE_ENV === 'development' 
      ? err.message 
      : 'Internal server error',
    err.statusCode || 500,
    process.env.NODE_ENV === 'development' 
      ? { stack: err.stack } 
      : null
  );
};

/**
 * 404 Not Found handler
 * Catches all requests that don't match any route
 */
const notFoundHandler = (req, res) => {
  return errorResponse(
    res,
    `Route ${req.method} ${req.path} not found`,
    404
  );
};

/**
 * Async handler wrapper
 * Catches async errors and passes to error middleware
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = {
  errorHandler,
  notFoundHandler,
  asyncHandler
};