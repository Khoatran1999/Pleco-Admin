/* eslint-disable-next-line no-unused-vars */
const errorHandler = (err, req, res, _next) => {
  // Log error details (sanitized in production)
  if (process.env.NODE_ENV === 'production') {
    console.error('Error:', {
      message: err.message,
      code: err.code,
      status: err.status,
    });
  } else {
    console.error('Error:', err);
  }

  // Supabase/PostgreSQL duplicate key error
  if (err.code === '23505') {
    return res.status(400).json({
      success: false,
      message: 'This record already exists.',
    });
  }

  // Supabase/PostgreSQL foreign key constraint error
  if (err.code === '23503') {
    return res.status(400).json({
      success: false,
      message: 'Referenced record does not exist.',
    });
  }

  // MySQL duplicate entry error (legacy)
  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(400).json({
      success: false,
      message: 'Duplicate entry. This record already exists.',
    });
  }

  // MySQL foreign key constraint error (legacy)
  if (err.code === 'ER_NO_REFERENCED_ROW_2') {
    return res.status(400).json({
      success: false,
      message: 'Referenced record does not exist.',
    });
  }

  // Validation error
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token.',
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token expired. Please login again.',
    });
  }

  // Sanitize error message in production
  const message =
    process.env.NODE_ENV === 'production'
      ? 'An error occurred. Please try again.'
      : err.message || 'Internal server error.';

  // Default server error
  res.status(err.status || 500).json({
    success: false,
    message,
  });
};

module.exports = errorHandler;
