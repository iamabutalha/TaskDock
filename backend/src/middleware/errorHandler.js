const errorHandler = (err, _req, res, next) => {
  const status = err.statusCode || 500;

  if (status >= 500) console.error("Server error", err);

  if (err.code === "23505") {
    return res.status(409).json({
      error: "Duplicate entry",
    });
  }

  return res.status(status).json({
    error: err.statusCode >= 500 ? "Internal server error" : err.message,
  });
};

const notFoundHandler = (_req, res) => {
  res.status(404).json({ error: "Route not found" });
};

module.exports = { errorHandler, notFoundHandler };
