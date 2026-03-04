'use strict';

const cors = require('@fastify/cors');
const helmet = require('@fastify/helmet');
const rateLimit = require('@fastify/rate-limit');
const jwt = require('@fastify/jwt');

async function registerPlugins(fastify) {
  await fastify.register(cors, { origin: true });
  await fastify.register(helmet);
  await fastify.register(rateLimit, { max: 100, timeWindow: '1 minute' });
  await fastify.register(jwt, { secret: process.env.JWT_SECRET });

  fastify.decorate('authenticate', async function (req, reply) {
    try {
      await req.jwtVerify();
    } catch (err) {
      reply.code(401).send({ error: { code: 'UNAUTHORIZED', message: 'Invalid or missing token' } });
    }
  });
}

module.exports = registerPlugins;
