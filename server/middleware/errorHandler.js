export function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;
  const isSafeClientError = statusCode >= 400 && statusCode < 500;

  // Only log server errors with details; skip stack in production logs
  if (statusCode >= 500) {
    console.error('Error:', err?.message || 'unknown');
  }

  const message = isSafeClientError
    ? (err.message || 'Request failed')
    : 'Internal Server Error';

  res.status(statusCode).json({
    success: false,
    error: {
      message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    }
  });
}
