'use strict';

exports.up = async function (knex) {
  await knex.schema.createTable('inventory_movement', (t) => {
    t.bigIncrements('movement_id').primary();
    t.bigInteger('business_id').notNullable()
      .references('business_id').inTable('business').onDelete('RESTRICT');
    t.bigInteger('product_id').notNullable()
      .references('product_id').inTable('product').onDelete('RESTRICT');
    t.text('tipo').notNullable();
    t.decimal('qty_delta', 12, 3).notNullable();
    t.text('ref_type');
    t.bigInteger('ref_id');
    t.text('nota');
    t.bigInteger('created_by').notNullable()
      .references('user_id').inTable('user').onDelete('RESTRICT');
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });

  await knex.raw(`
    ALTER TABLE inventory_movement
      ADD CONSTRAINT chk_im_tipo      CHECK (tipo IN ('ENTRADA', 'AJUSTE', 'VENTA')),
      ADD CONSTRAINT chk_im_qty_delta CHECK (qty_delta <> 0),
      ADD CONSTRAINT chk_im_ref_type  CHECK (ref_type IS NULL OR ref_type IN ('TICKET', 'AJUSTE', 'ENTRADA'))
  `);

  await knex.raw(`CREATE INDEX idx_im_biz_product_created ON inventory_movement (business_id, product_id, created_at DESC)`);
  await knex.raw(`CREATE INDEX idx_im_biz_tipo_created    ON inventory_movement (business_id, tipo, created_at DESC)`);
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('inventory_movement');
};
