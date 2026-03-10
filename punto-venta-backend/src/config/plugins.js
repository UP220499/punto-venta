'use strict';

const cors = require('@fastify/cors');
const helmet = require('@fastify/helmet');
const rateLimit = require('@fastify/rate-limit');
const jwt = require('@fastify/jwt');

function parseCsvOrigins(value) {
  return String(value || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

function buildCorsOriginResolver(env = process.env) {
  const configuredOrigins = parseCsvOrigins(env.CORS_ORIGINS);
  const isProduction = env.NODE_ENV === 'production';
  const allowedOrigins = configuredOrigins.length
    ? configuredOrigins
    : isProduction
      ? []
      : ['http://localhost:5173', 'http://127.0.0.1:5173'];

  const allowList = new Set(allowedOrigins);

  return function originResolver(origin, cb) {
    if (!origin) {
      cb(null, true);
      return;
    }

    cb(null, allowList.has(origin));
  };
}

async function registerPlugins(fastify) {

  await fastify.register(cors, { origin: buildCorsOriginResolver(process.env), strictPreflight: false });

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
module.exports.buildCorsOriginResolver = buildCorsOriginResolver;
module.exports.parseCsvOrigins = parseCsvOrigins;
