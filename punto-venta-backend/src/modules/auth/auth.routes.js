'use strict';

const { z } = require('zod');
const bcrypt = require('bcryptjs');
const repo = require('./auth.repository');

const loginSchema = z.object({
  username: z.string().trim().min(1, 'username is required'),
  password: z.string().min(1, 'password is required'),
});

function parseLogin(data) {
  const result = loginSchema.safeParse(data);
  if (!result.success) {
    const msg = result.error.issues.map((i) => i.message).join('; ');
    const err = new Error(msg);
    err.statusCode = 400;
    err.code = 'VALIDATION_ERROR';
    throw err;
  }
  return result.data;
}

async function authRoutes(fastify) {
  // POST /auth/login — real login with bcrypt
  fastify.post('/login', async function (request, reply) {
    const { username, password } = parseLogin(request.body);

    const businessId = Number(process.env.BUSINESS_ID || 1);
    const user = await repo.findUserByUsername(businessId, username);

    // Generic 401 to avoid user enumeration
    if (!user || user.estatus !== 'ACTIVO') {
      return reply.code(401).send({ error: { code: 'UNAUTHORIZED', message: 'Invalid credentials' } });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return reply.code(401).send({ error: { code: 'UNAUTHORIZED', message: 'Invalid credentials' } });
    }

    const { roles, permissions } = await repo.getUserRolesAndPermissions(user.user_id);

    const payload = {
      sub: user.user_id,
      business_id: user.business_id,
      username: user.username,
      roles,
      permissions,
    };

    const access_token = fastify.jwt.sign(payload, { expiresIn: '8h' });

    // Fire-and-forget: update last_login_at
    repo.updateLastLogin(user.user_id).catch(() => {});

    return reply.send({ access_token });
  });

  // GET /auth/me — protected, returns current user info from token
  fastify.get('/me', { onRequest: [fastify.authenticate] }, async function (request, reply) {
    const { sub, business_id, username, roles, permissions } = request.user;
    return reply.send({ user_id: sub, business_id, username, roles, permissions });
  });
}

module.exports = authRoutes;
