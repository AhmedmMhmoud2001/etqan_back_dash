const { error } = require('../utils/response');

const notFound = (req, res, next) => {
  error(res, `Not found - ${req.originalUrl}`, 404);
};

const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Internal server error';
  const errors = err.errors || null;
  error(res, message, statusCode, errors);
};

module.exports = { notFound, errorHandler };
