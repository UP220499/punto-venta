'use strict';

exports.up = async function (knex) {
  await knex.schema.createTable('product', (t) => {
    t.bigIncrements('product_id').primary();
    t.bigInteger('business_id').notNullable()
      .references('business_id').inTable('business').onDelete('RESTRICT');
    t.text('sku').notNullable();
    t.text('nombre').notNullable();
    t.text('descripcion');
    t.decimal('precio_venta', 12, 2).notNullable();
    t.decimal('costo', 12, 2);
    t.decimal('stock_actual', 12, 3).notNullable().defaultTo(0);
    t.decimal('stock_minimo', 12, 3).notNullable().defaultTo(0);
    t.text('unidad').notNullable().defaultTo('pz');
    t.text('estatus').notNullable().defaultTo('ACTIVO');
    t.bigInteger('created_by')
      .references('user_id').inTable('user').onDelete('SET NULL');
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    t.unique(['business_id', 'sku']);
  });

  // CHECK constraints
  await knex.raw(`
    ALTER TABLE product
      ADD CONSTRAINT chk_product_precio_venta CHECK (precio_venta > 0),
      ADD CONSTRAINT chk_product_costo        CHECK (costo IS NULL OR costo >= 0),
      ADD CONSTRAINT chk_product_stock_actual  CHECK (stock_actual >= 0),
      ADD CONSTRAINT chk_product_stock_minimo  CHECK (stock_minimo >= 0),
      ADD CONSTRAINT chk_product_estatus       CHECK (estatus IN ('ACTIVO', 'INACTIVO'))
  `);

  // Additional indexes
  await knex.raw(`CREATE INDEX idx_product_business_estatus ON product (business_id, estatus)`);
  await knex.raw(`CREATE INDEX idx_product_business_nombre  ON product (business_id, nombre)`);
  await knex.raw(`CREATE INDEX idx_product_business_created ON product (business_id, created_at)`);
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('product');
};
