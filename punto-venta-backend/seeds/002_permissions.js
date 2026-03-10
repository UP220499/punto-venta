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
    { code: 'PRODUCT_WRITE',         descripcion: 'Crear/editar/eliminar productos' },
    // Inventory
    { code: 'INVENTORY_VIEW',        descripcion: 'Ver inventario' },
    { code: 'INVENTORY_ADJUST',      descripcion: 'Ajustar inventario' },
    { code: 'INVENTORY_READ',        descripcion: 'Ver movimientos e inventario' },
    { code: 'INVENTORY_WRITE',       descripcion: 'Registrar entradas y ajustes' },
    // Sales
    { code: 'SALE_CREATE',           descripcion: 'Crear ventas' },
    { code: 'SALE_VIEW',             descripcion: 'Ver ventas' },
    { code: 'SALE_CANCEL',           descripcion: 'Cancelar ventas' },
    { code: 'SALE_CLOSE',            descripcion: 'Cerrar tickets de venta' },
    // Reports
    { code: 'REPORT_SALES',          descripcion: 'Ver reportes de ventas' },
    { code: 'REPORT_INVENTORY',      descripcion: 'Ver reportes de inventario' },
    { code: 'REPORT_READ',           descripcion: 'Ver todos los reportes' },
    // Settings
    { code: 'SETTINGS_MANAGE',       descripcion: 'Administrar configuración del negocio' },
    { code: 'SETTINGS_READ',         descripcion: 'Ver configuración del negocio' },
    { code: 'SETTINGS_WRITE',        descripcion: 'Editar configuración del negocio' },
    // Users
    { code: 'USER_CREATE',           descripcion: 'Crear usuarios' },
    { code: 'USER_READ',             descripcion: 'Ver usuarios' },
    { code: 'USER_UPDATE',           descripcion: 'Editar usuarios' },
    { code: 'USER_DELETE',           descripcion: 'Eliminar usuarios' },
    { code: 'USER_WRITE',            descripcion: 'Crear, editar y administrar usuarios' },
    // Audit
    { code: 'AUDIT_READ',            descripcion: 'Ver log de auditoría' },
  ];

  await knex('permission').insert(permissions).onConflict('code').ignore();
};
