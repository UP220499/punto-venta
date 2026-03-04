'use strict';

require('dotenv').config();

const fastify = require('fastify')({
  logger: {
    level: 'info',
    ...(process.env.NODE_ENV !== 'production' && {
      transport: { target: 'pino-pretty' },
    }),
  },
});

const registerPlugins = require('./config/plugins');
const registerRoutes = require('./config/routes');
const setErrorHandler = require('./shared/error-handler');

async function start() {
  await registerPlugins(fastify);
  await registerRoutes(fastify);
  setErrorHandler(fastify);

  const port = Number(process.env.PORT) || 3000;

  await fastify.listen({ port, host: '0.0.0.0' });
}

start().catch(function (err) {
  fastify.log.error(err);
  process.exit(1);
});
