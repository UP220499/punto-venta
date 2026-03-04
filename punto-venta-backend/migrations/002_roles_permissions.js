'use strict';

exports.up = async function (knex) {
  // role
  await knex.schema.createTable('role', (t) => {
    t.bigIncrements('role_id').primary();
    t.text('code').notNullable().unique();
    t.text('nombre_visible').notNullable();
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });

  // permission
  await knex.schema.createTable('permission', (t) => {
    t.bigIncrements('permission_id').primary();
    t.text('code').notNullable().unique();
    t.text('descripcion').notNullable();
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });

  // role_permission
  await knex.schema.createTable('role_permission', (t) => {
    t.bigIncrements('role_permission_id').primary();
    t.bigInteger('role_id').notNullable()
      .references('role_id').inTable('role').onDelete('CASCADE');
    t.bigInteger('permission_id').notNullable()
      .references('permission_id').inTable('permission').onDelete('CASCADE');
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.unique(['role_id', 'permission_id']);
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('role_permission');
  await knex.schema.dropTableIfExists('permission');
  await knex.schema.dropTableIfExists('role');
};
