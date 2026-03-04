'use strict';

exports.up = async function (knex) {
  await knex.schema.createTable('sale_payment', (t) => {
    t.bigIncrements('payment_id').primary();
    t.bigInteger('business_id').notNullable()
      .references('business_id').inTable('business').onDelete('RESTRICT');
    t.bigInteger('ticket_id').notNullable()
      .references('ticket_id').inTable('sale_ticket').onDelete('CASCADE');
    t.bigInteger('method_id').notNullable()
      .references('method_id').inTable('payment_method').onDelete('RESTRICT');
    t.decimal('monto', 12, 2).notNullable();
    t.text('referencia');
    t.bigInteger('created_by').notNullable()
      .references('user_id').inTable('user').onDelete('RESTRICT');
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });

  await knex.raw(`
    ALTER TABLE sale_payment
      ADD CONSTRAINT chk_sp_monto CHECK (monto > 0)
  `);

  await knex.raw(`CREATE INDEX idx_sp_biz_ticket ON sale_payment (business_id, ticket_id)`);
  await knex.raw(`CREATE INDEX idx_sp_biz_method ON sale_payment (business_id, method_id)`);
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('sale_payment');
};
