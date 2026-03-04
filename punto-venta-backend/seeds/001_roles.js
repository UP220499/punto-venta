'use strict';

exports.seed = async function (knex) {
  const roles = [
    { code: 'ADMIN',      nombre_visible: 'Administrador' },
    { code: 'CAJERO',     nombre_visible: 'Cajero' },
    { code: 'INVENTARIO', nombre_visible: 'Inventario' },
  ];

  await knex('role').insert(roles).onConflict('code').ignore();
};
