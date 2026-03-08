'use strict';

const { knex } = require('../../config/db');

async function findUserByUsername(businessId, username) {
  return knex('user')
    .where({ business_id: businessId, username })
    .first();
}

async function getUserRolesAndPermissions(userId) {
  // roles
  const roleRows = await knex('user_role as ur')
    .join('role as r', 'r.role_id', 'ur.role_id')
    .where('ur.user_id', userId)
    .select('r.code as role_code');

  // permissions (deduplicated via distinct)
  const permRows = await knex('user_role as ur')
    .join('role_permission as rp', 'rp.role_id', 'ur.role_id')
    .join('permission as p', 'p.permission_id', 'rp.permission_id')
    .where('ur.user_id', userId)
    .distinct('p.code as permission_code')
    .select('p.code as permission_code');

  return {
    roles: roleRows.map((r) => r.role_code),
    permissions: permRows.map((p) => p.permission_code),
  };
}

async function updateLastLogin(userId) {
  await knex('user')
    .where({ user_id: userId })
    .update({ last_login_at: knex.fn.now() });
}

module.exports = { findUserByUsername, getUserRolesAndPermissions, updateLastLogin };
