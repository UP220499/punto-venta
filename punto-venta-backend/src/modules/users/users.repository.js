'use strict';

const { knex } = require('../../config/db');

const USER_COLS = ['user_id', 'username', 'nombre', 'estatus', 'created_at', 'last_login_at'];

// ── helpers ──────────────────────────────────────────────────────────────────

function mapUser(user, rolesArr) {
  return {
    user_id:       user.user_id,
    username:      user.username,
    nombre:        user.nombre,
    activo:        user.estatus === 'ACTIVO',
    roles:         rolesArr,
    created_at:    user.created_at,
    last_login_at: user.last_login_at,
  };
}

async function fetchRolesForIds(userIds) {
  const rows = await knex('user_role as ur')
    .join('role as r', 'r.role_id', 'ur.role_id')
    .whereIn('ur.user_id', userIds)
    .select('ur.user_id', 'r.code as role_code');

  const map = {};
  for (const row of rows) {
    if (!map[row.user_id]) map[row.user_id] = [];
    map[row.user_id].push(row.role_code);
  }
  return map;
}

// ── queries ───────────────────────────────────────────────────────────────────

async function listUsers(businessId, { page, pageSize, q, activo }) {
  let query = knex('user').where('business_id', businessId);

  if (activo !== undefined) {
    query = query.where('estatus', activo ? 'ACTIVO' : 'BLOQUEADO');
  }
  if (q) {
    query = query.where(function () {
      this.whereILike('username', `%${q}%`).orWhereILike('nombre', `%${q}%`);
    });
  }

  const [{ count }] = await query.clone().count('* as count');

  const users = await query
    .select(USER_COLS)
    .orderBy('user_id', 'asc')
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  if (users.length === 0) return { items: [], total: Number(count) };

  const rolesMap = await fetchRolesForIds(users.map((u) => u.user_id));
  const items = users.map((u) => mapUser(u, rolesMap[u.user_id] || []));

  return { items, total: Number(count) };
}

async function getUserById(userId, businessId) {
  const user = await knex('user')
    .where({ user_id: userId, business_id: businessId })
    .select(USER_COLS)
    .first();

  if (!user) return null;

  const rolesMap = await fetchRolesForIds([userId]);
  return mapUser(user, rolesMap[userId] || []);
}

async function findUserByUsername(businessId, username) {
  return knex('user').where({ business_id: businessId, username }).first();
}

async function createUser(businessId, { username, nombre, passwordHash, roleIds }) {
  return knex.transaction(async (trx) => {
    const [row] = await trx('user')
      .insert({
        business_id:   businessId,
        username,
        nombre,
        password_hash: passwordHash,
        estatus:       'ACTIVO',
      })
      .returning('user_id');

    const user_id = row.user_id ?? row;  // Knex may return object or scalar
    await trx('user_role').insert(roleIds.map((role_id) => ({ user_id, role_id })));

    return Number(user_id);
  });
}

async function patchUser(userId, businessId, updates) {
  const count = await knex('user')
    .where({ user_id: userId, business_id: businessId })
    .update({ ...updates, updated_at: knex.fn.now() });
  return count > 0;
}

async function updatePassword(userId, passwordHash) {
  await knex('user')
    .where({ user_id: userId })
    .update({ password_hash: passwordHash, updated_at: knex.fn.now() });
}

async function setUserRoles(userId, roleIds) {
  return knex.transaction(async (trx) => {
    await trx('user_role').where({ user_id: userId }).delete();
    await trx('user_role').insert(roleIds.map((role_id) => ({ user_id: userId, role_id })));
  });
}

async function getRolesByCode(codes) {
  return knex('role').whereIn('code', codes).select('role_id', 'code');
}

async function getUserRoleCodes(userId) {
  const rows = await knex('user_role as ur')
    .join('role as r', 'r.role_id', 'ur.role_id')
    .where('ur.user_id', userId)
    .select('r.code as role_code');
  return rows.map((r) => r.role_code);
}

module.exports = {
  listUsers,
  getUserById,
  findUserByUsername,
  createUser,
  patchUser,
  updatePassword,
  setUserRoles,
  getRolesByCode,
  getUserRoleCodes,
};
