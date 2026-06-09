const errorMiddleware = (err, req, res, next) => {
  console.error(err.stack);

  if (err.name === "ValidationError") {
    return res.status(400).json({
      status: "FAILED",
      message: err.message,
    });
  }

  if (err.name === "CastError") {
    return res.status(400).json({
      status: "FAILED",
      message: `Invalid ${err.path}`,
    });
  }

  if (err.code === 11000) {
    return res.status(409).json({
      status: "FAILED",
      message: "Duplicate value detected",
    });
  }

  res.status(err.statusCode || 500).json({
    status: "ERROR",
    message: err.message || "Internal Server Error",
  });
};

module.exports = errorMiddleware;
