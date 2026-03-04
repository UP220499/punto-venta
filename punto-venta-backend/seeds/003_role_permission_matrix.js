'use strict';

exports.seed = async function (knex) {
  // Define which permissions each role gets
  const matrix = {
    ADMIN: [
      'DASHBOARD_VIEW',
      'PRODUCT_CREATE', 'PRODUCT_READ', 'PRODUCT_UPDATE', 'PRODUCT_DELETE',
      'INVENTORY_VIEW', 'INVENTORY_ADJUST',
      'SALE_CREATE', 'SALE_VIEW', 'SALE_CANCEL',
      'REPORT_SALES', 'REPORT_INVENTORY',
      'SETTINGS_MANAGE',
      'USER_CREATE', 'USER_READ', 'USER_UPDATE', 'USER_DELETE',
    ],
    CAJERO: [
      'DASHBOARD_VIEW',
      'PRODUCT_READ',
      'SALE_CREATE', 'SALE_VIEW',
    ],
    INVENTARIO: [
      'DASHBOARD_VIEW',
      'PRODUCT_CREATE', 'PRODUCT_READ', 'PRODUCT_UPDATE',
      'INVENTORY_VIEW', 'INVENTORY_ADJUST',
      'REPORT_INVENTORY',
    ],
  };

  // Fetch lookup maps
  const roles = await knex('role').select('role_id', 'code');
  const perms = await knex('permission').select('permission_id', 'code');

  const roleMap = Object.fromEntries(roles.map((r) => [r.code, r.role_id]));
  const permMap = Object.fromEntries(perms.map((p) => [p.code, p.permission_id]));

  const rows = [];
  for (const [roleCode, permCodes] of Object.entries(matrix)) {
    for (const permCode of permCodes) {
      rows.push({
        role_id: roleMap[roleCode],
        permission_id: permMap[permCode],
      });
    }
  }

  await knex('role_permission')
    .insert(rows)
    .onConflict(['role_id', 'permission_id'])
    .ignore();
};
