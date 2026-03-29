export function errorHandler(err, req, res, next) {
  console.error('Error:', err?.message || 'unknown');

  const statusCode = err.statusCode || 500;
  const isSafeClientError = statusCode >= 400 && statusCode < 500;
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
