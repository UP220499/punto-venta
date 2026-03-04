'use strict';

exports.up = async function (knex) {
  // "user" is a reserved word in PostgreSQL — Knex handles quoting automatically
  await knex.schema.createTable('user', (t) => {
    t.bigIncrements('user_id').primary();
    t.bigInteger('business_id').notNullable()
      .references('business_id').inTable('business').onDelete('RESTRICT');
    t.text('username').notNullable();
    t.text('password_hash').notNullable();
    t.text('nombre').notNullable();
    t.text('email');
    t.text('estatus').notNullable().defaultTo('ACTIVO');
    t.timestamp('last_login_at', { useTz: true });
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.unique(['business_id', 'username']);
  });

  await knex.raw(`
    ALTER TABLE "user"
      ADD CONSTRAINT chk_user_estatus
      CHECK (estatus IN ('ACTIVO', 'BLOQUEADO'))
  `);

  // user_role
  await knex.schema.createTable('user_role', (t) => {
    t.bigIncrements('user_role_id').primary();
    t.bigInteger('user_id').notNullable()
      .references('user_id').inTable('user').onDelete('CASCADE');
    t.bigInteger('role_id').notNullable()
      .references('role_id').inTable('role').onDelete('RESTRICT');
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.unique(['user_id', 'role_id']);
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('user_role');
  await knex.schema.dropTableIfExists('user');
};
