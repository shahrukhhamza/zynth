export function errorHandler(err, req, res, next) {
  // Multer upload errors (file too large, unexpected field…) are client mistakes, not 500s.
  let statusCode = err.statusCode || err.status || 500;
  if (err.name === 'MulterError') {
    statusCode = err.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
    err.message = err.code === 'LIMIT_FILE_SIZE' ? 'File is too large.' : err.message;
  } else if (/^Only image files/.test(err.message || '')) {
    statusCode = 400;
  }
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
