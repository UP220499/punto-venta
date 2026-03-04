'use strict';

exports.seed = async function (knex) {
  const permissions = [
    // Dashboard
    { code: 'DASHBOARD_VIEW',        descripcion: 'Ver dashboard principal' },
    // Products
    { code: 'PRODUCT_CREATE',        descripcion: 'Crear productos' },
    { code: 'PRODUCT_READ',          descripcion: 'Ver productos' },
    { code: 'PRODUCT_UPDATE',        descripcion: 'Editar productos' },
    { code: 'PRODUCT_DELETE',        descripcion: 'Eliminar productos' },
    // Inventory
    { code: 'INVENTORY_VIEW',        descripcion: 'Ver inventario' },
    { code: 'INVENTORY_ADJUST',      descripcion: 'Ajustar inventario' },
    // Sales
    { code: 'SALE_CREATE',           descripcion: 'Crear ventas' },
    { code: 'SALE_VIEW',             descripcion: 'Ver ventas' },
    { code: 'SALE_CANCEL',           descripcion: 'Cancelar ventas' },
    // Reports
    { code: 'REPORT_SALES',          descripcion: 'Ver reportes de ventas' },
    { code: 'REPORT_INVENTORY',      descripcion: 'Ver reportes de inventario' },
    // Settings
    { code: 'SETTINGS_MANAGE',       descripcion: 'Administrar configuración del negocio' },
    // Users
    { code: 'USER_CREATE',           descripcion: 'Crear usuarios' },
    { code: 'USER_READ',             descripcion: 'Ver usuarios' },
    { code: 'USER_UPDATE',           descripcion: 'Editar usuarios' },
    { code: 'USER_DELETE',           descripcion: 'Eliminar usuarios' },
  ];

  await knex('permission').insert(permissions).onConflict('code').ignore();
};
