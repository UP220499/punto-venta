'use strict';

const { knex } = require('../../config/db');

// ── helpers ──────────────────────────────────────────────────────────────────

async function fetchPermissionsForRoleIds(roleIds) {
  const rows = await knex('role_permission as rp')
    .join('permission as p', 'p.permission_id', 'rp.permission_id')
    .whereIn('rp.role_id', roleIds)
    .select('rp.role_id', 'p.code as permission_code');

  const map = {};
  for (const row of rows) {
    if (!map[row.role_id]) map[row.role_id] = [];
    map[row.role_id].push(row.permission_code);
  }
  return map;
}

function mapRole(role, permCodes) {
  return {
    role_id:     role.role_id,
    code:        role.code,
    nombre:      role.nombre_visible,
    permissions: permCodes,
  };
}

// ── queries ───────────────────────────────────────────────────────────────────

async function listRoles() {
  const roles = await knex('role')
    .select('role_id', 'code', 'nombre_visible')
    .orderBy('role_id', 'asc');

  if (roles.length === 0) return [];

  const permsMap = await fetchPermissionsForRoleIds(roles.map((r) => r.role_id));
  return roles.map((r) => mapRole(r, permsMap[r.role_id] || []));
}

async function getRoleById(roleId) {
  const role = await knex('role')
    .where('role_id', roleId)
    .select('role_id', 'code', 'nombre_visible')
    .first();

  if (!role) return null;

  const permsMap = await fetchPermissionsForRoleIds([roleId]);
  return mapRole(role, permsMap[roleId] || []);
}

async function listPermissions() {
  return knex('permission')
    .select('permission_id', 'code', 'descripcion')
    .orderBy('code', 'asc');
}

async function getPermissionsByCodes(codes) {
  return knex('permission').whereIn('code', codes).select('permission_id', 'code');
}

async function setRolePermissions(roleId, permissionIds) {
  return knex.transaction(async (trx) => {
    await trx('role_permission').where({ role_id: roleId }).delete();
    if (permissionIds.length > 0) {
      await trx('role_permission').insert(
        permissionIds.map((permission_id) => ({ role_id: roleId, permission_id })),
      );
    }
  });
}

module.exports = {
  listRoles,
  getRoleById,
  listPermissions,
  getPermissionsByCodes,
  setRolePermissions,
};
