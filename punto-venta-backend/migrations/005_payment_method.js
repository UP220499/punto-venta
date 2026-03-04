'use strict';

exports.up = async function (knex) {
  await knex.schema.createTable('payment_method', (t) => {
    t.bigIncrements('method_id').primary();
    t.text('code').notNullable().unique();
    t.text('nombre_visible').notNullable();
    t.boolean('allows_change').notNullable().defaultTo(false);
    t.boolean('requires_reference').notNullable().defaultTo(false);
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('payment_method');
};
