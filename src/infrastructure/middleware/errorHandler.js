// infrastructure/middleware/errorHandler.js
// Central error handler so routes stay clean (they just throw / call next(err)).
// Keeps every error response in one consistent JSON shape.

// Wrap async route handlers so thrown errors reach the handler below.
export function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

// 404 for unmatched routes.
export function notFound(req, res) {
  res.status(404).json({ error: "Not found", path: req.originalUrl });
}

// Final error handler (must have 4 args for Express to recognize it).
export function errorHandler(err, req, res, _next) {
  const status = err.status || 500;
  res.status(status).json({
    error: err.message || "Internal server error",
  });
}
