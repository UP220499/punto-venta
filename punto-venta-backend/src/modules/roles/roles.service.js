'use strict';

const repo = require('./roles.repository');
const { parse, putPermissionsBody } = require('./roles.schemas');

function appError(code, message, statusCode) {
  const err = new Error(message);
  err.code = code;
  err.statusCode = statusCode;
  return err;
}

// ── GET /roles ────────────────────────────────────────────────────────────────

async function listRoles() {
  return repo.listRoles();
}

// ── GET /roles/permissions ────────────────────────────────────────────────────

async function listPermissions() {
  return repo.listPermissions();
}

// ── GET /roles/:role_id ───────────────────────────────────────────────────────

async function getRoleById(roleId) {
  const role = await repo.getRoleById(roleId);
  if (!role) throw appError('ROLE_NOT_FOUND', 'Role not found', 404);
  return role;
}

// ── PUT /roles/:role_id/permissions ───────────────────────────────────────────

async function setRolePermissions(roleId, rawBody) {
  const body = parse(putPermissionsBody, rawBody);

  const role = await repo.getRoleById(roleId);
  if (!role) throw appError('ROLE_NOT_FOUND', 'Role not found', 404);

  if (role.code === 'ADMIN') {
    throw appError('CANNOT_MODIFY_ADMIN_ROLE', 'Cannot modify permissions of the ADMIN role', 409);
  }

  if (body.permission_codes.length === 0) {
    await repo.setRolePermissions(roleId, []);
    return { role_id: roleId, permissions: [] };
  }

  const uniqueCodes = [...new Set(body.permission_codes)];
  const found = await repo.getPermissionsByCodes(uniqueCodes);

  if (found.length !== uniqueCodes.length) {
    const foundSet = new Set(found.map((p) => p.code));
    const invalid = uniqueCodes.filter((c) => !foundSet.has(c));
    throw appError('VALIDATION_ERROR', `Unknown permission codes: ${invalid.join(', ')}`, 400);
  }

  await repo.setRolePermissions(roleId, found.map((p) => p.permission_id));
  return { role_id: roleId, permissions: uniqueCodes };
}

module.exports = { listRoles, listPermissions, getRoleById, setRolePermissions };
