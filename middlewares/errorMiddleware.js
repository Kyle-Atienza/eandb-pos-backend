const errorHandler = (err, req, res, next) => {
  console.error(err); // Log the error for debugging purposes

  // Set the status code for the response
  const statusCode = err.statusCode || 500;
  res.status(statusCode);

  // Send the error message as the response
  res.json({
    error: {
      message: err.message,
    },
  });
};

module.exports = {
  errorHandler,
};
