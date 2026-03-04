'use strict';

async function authRoutes(fastify) {
  // POST /auth/login — stub: returns a signed JWT
  fastify.post('/login', async function (request, reply) {
    const payload = {
      sub: 1,
      business_id: Number(process.env.BUSINESS_ID || 1),
      roles: ['ADMIN'],
    };

    const access_token = fastify.jwt.sign(payload, { expiresIn: '8h' });

    return reply.send({ access_token });
  });

  // GET /auth/me — protected, returns current user info from token
  fastify.get('/me', { onRequest: [fastify.authenticate] }, async function (request, reply) {
    const { sub, business_id, roles } = request.user;

    return reply.send({ user_id: sub, business_id, roles });
  });
}

module.exports = authRoutes;
