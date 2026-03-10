'use strict';

exports.up = async function (knex) {
  await knex.schema.alterTable('payment_method', (t) => {
    t.text('estatus').notNullable().defaultTo('ACTIVO');
    t.integer('sort_order').notNullable().defaultTo(0);
  });

  await knex.raw(`
    ALTER TABLE payment_method
      ADD CONSTRAINT chk_pm_estatus CHECK (estatus IN ('ACTIVO', 'INACTIVO'))
  `);
};

exports.down = async function (knex) {
  await knex.raw(`ALTER TABLE payment_method DROP CONSTRAINT IF EXISTS chk_pm_estatus`);
  await knex.schema.alterTable('payment_method', (t) => {
    t.dropColumn('estatus');
    t.dropColumn('sort_order');
  });
};
