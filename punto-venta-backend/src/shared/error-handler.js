'use strict';

function setErrorHandler(fastify) {
  fastify.setErrorHandler(function (error, request, reply) {
    const statusCode = error.statusCode || 500;

    request.log.error(error);

    reply.code(statusCode).send({
      error: {
        code: error.code || 'INTERNAL_ERROR',
        message: statusCode === 500 && process.env.NODE_ENV === 'production'
          ? 'Internal server error'
          : error.message,
      },
    });
  });
}

module.exports = setErrorHandler;
