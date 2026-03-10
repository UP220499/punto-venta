'use strict';

const bcrypt = require('bcryptjs');
const repo = require('./users.repository');
const { parse, listUsersQuery, createUserBody, patchUserBody, resetPasswordBody, putRolesBody } = require('./users.schemas');

function appError(code, message, statusCode) {
  const err = new Error(message);
  err.code = code;
  err.statusCode = statusCode;
  return err;
}

async function resolveRoleCodes(codes) {
  const found = await repo.getRolesByCode(codes);
  if (found.length !== codes.length) {
    const foundSet = new Set(found.map((r) => r.code));
    const invalid = codes.filter((c) => !foundSet.has(c));
    throw appError('VALIDATION_ERROR', `Unknown role codes: ${invalid.join(', ')}`, 400);
  }
  return found;
}

// ── GET /users ────────────────────────────────────────────────────────────────

async function listUsers(businessId, rawQuery) {
  const q = parse(listUsersQuery, rawQuery);
  const activo = q.activo === undefined ? undefined : q.activo === 'true';

  const { items, total } = await repo.listUsers(businessId, {
    page:     q.page,
    pageSize: q.page_size,
    q:        q.q ?? null,
    activo,
  });

  return { items, page: q.page, page_size: q.page_size, total };
}

// ── GET /users/:user_id ───────────────────────────────────────────────────────

async function getUserById(userId, businessId) {
  const user = await repo.getUserById(userId, businessId);
  if (!user) throw appError('USER_NOT_FOUND', 'User not found', 404);
  return user;
}

// ── POST /users ───────────────────────────────────────────────────────────────

async function createUser(businessId, rawBody) {
  const body = parse(createUserBody, rawBody);

  const roles = await resolveRoleCodes(body.role_codes);

  const existing = await repo.findUserByUsername(businessId, body.username);
  if (existing) {
    throw appError('USERNAME_ALREADY_EXISTS', `Username '${body.username}' is already taken`, 409);
  }

  const passwordHash = await bcrypt.hash(body.password, 10);
  const roleIds = roles.map((r) => r.role_id);

  const user_id = await repo.createUser(businessId, {
    username: body.username,
    nombre:   body.nombre,
    passwordHash,
    roleIds,
  });

  return { user_id, username: body.username, nombre: body.nombre, activo: true, roles: body.role_codes };
}

// ── PATCH /users/:user_id ─────────────────────────────────────────────────────

async function patchUser(userId, businessId, requestingUserId, rawBody) {
  const body = parse(patchUserBody, rawBody);

  if (body.activo === false && Number(userId) === Number(requestingUserId)) {
    throw appError('CANNOT_DEACTIVATE_SELF', 'Cannot deactivate your own account', 409);
  }

  const existing = await repo.getUserById(userId, businessId);
  if (!existing) throw appError('USER_NOT_FOUND', 'User not found', 404);

  const updates = {};
  if (body.nombre !== undefined) updates.nombre = body.nombre;
  if (body.activo !== undefined) updates.estatus = body.activo ? 'ACTIVO' : 'BLOQUEADO';

  await repo.patchUser(userId, businessId, updates);

  return repo.getUserById(userId, businessId);
}

// ── POST /users/:user_id/reset-password ───────────────────────────────────────

async function resetPassword(userId, businessId, rawBody) {
  const { password } = parse(resetPasswordBody, rawBody);

  const existing = await repo.getUserById(userId, businessId);
  if (!existing) throw appError('USER_NOT_FOUND', 'User not found', 404);

  const passwordHash = await bcrypt.hash(password, 10);
  await repo.updatePassword(userId, passwordHash);
}

// ── PUT /users/:user_id/roles ─────────────────────────────────────────────────

async function setUserRoles(userId, businessId, requestingUserId, rawBody) {
  const body = parse(putRolesBody, rawBody);

  const existing = await repo.getUserById(userId, businessId);
  if (!existing) throw appError('USER_NOT_FOUND', 'User not found', 404);

  const roles = await resolveRoleCodes(body.role_codes);

  // Prevent removing your own ADMIN role
  if (Number(userId) === Number(requestingUserId) && !body.role_codes.includes('ADMIN')) {
    const currentRoles = await repo.getUserRoleCodes(userId);
    if (currentRoles.includes('ADMIN')) {
      throw appError('CANNOT_REMOVE_OWN_ADMIN', 'Cannot remove ADMIN role from your own account', 409);
    }
  }

  const roleIds = roles.map((r) => r.role_id);
  await repo.setUserRoles(userId, roleIds);

  return { user_id: userId, roles: body.role_codes };
}

module.exports = { listUsers, getUserById, createUser, patchUser, resetPassword, setUserRoles };
