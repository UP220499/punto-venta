'use strict';

exports.up = async function (knex) {
  await knex.schema.createTable('business', (t) => {
    t.bigIncrements('business_id').primary();
    t.text('nombre').notNullable();
    t.text('estatus').notNullable().defaultTo('ACTIVO');
    t.text('timezone').notNullable().defaultTo('America/Mexico_City');
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });

  await knex.raw(`
    ALTER TABLE business
      ADD CONSTRAINT chk_business_estatus
      CHECK (estatus IN ('ACTIVO', 'INACTIVO'))
  `);
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('business');
};
