'use strict';

exports.up = async function (knex) {
  await knex.schema.createTable('sale_ticket_item', (t) => {
    t.bigIncrements('item_id').primary();
    t.bigInteger('business_id').notNullable()
      .references('business_id').inTable('business').onDelete('RESTRICT');
    t.bigInteger('ticket_id').notNullable()
      .references('ticket_id').inTable('sale_ticket').onDelete('CASCADE');
    t.bigInteger('product_id').notNullable()
      .references('product_id').inTable('product').onDelete('RESTRICT');
    t.decimal('cantidad', 12, 3).notNullable();
    t.decimal('precio_unitario', 12, 2).notNullable();
    t.decimal('subtotal_linea', 12, 2).notNullable();
    t.text('product_sku_snapshot').notNullable();
    t.text('product_nombre_snapshot').notNullable();
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });

  await knex.raw(`
    ALTER TABLE sale_ticket_item
      ADD CONSTRAINT chk_sti_cantidad        CHECK (cantidad > 0),
      ADD CONSTRAINT chk_sti_precio_unitario CHECK (precio_unitario > 0),
      ADD CONSTRAINT chk_sti_subtotal_linea  CHECK (subtotal_linea > 0)
  `);

  await knex.raw(`CREATE INDEX idx_sti_biz_ticket  ON sale_ticket_item (business_id, ticket_id)`);
  await knex.raw(`CREATE INDEX idx_sti_biz_product ON sale_ticket_item (business_id, product_id)`);
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('sale_ticket_item');
};
