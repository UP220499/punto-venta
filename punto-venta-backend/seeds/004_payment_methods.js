'use strict';

exports.seed = async function (knex) {
  const methods = [
    { code: 'EFECTIVO',      nombre_visible: 'Efectivo',      allows_change: true,  requires_reference: false },
    { code: 'TARJETA',       nombre_visible: 'Tarjeta',       allows_change: false, requires_reference: false },
    { code: 'TRANSFERENCIA', nombre_visible: 'Transferencia', allows_change: false, requires_reference: true },
    { code: 'OTRO',          nombre_visible: 'Otro',          allows_change: false, requires_reference: false },
  ];

  await knex('payment_method').insert(methods).onConflict('code').ignore();
};
