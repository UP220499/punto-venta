'use strict';

exports.up = async function (knex) {
  await knex.schema.createTable('product_barcode', (t) => {
    t.bigIncrements('barcode_id').primary();
    t.bigInteger('business_id').notNullable()
      .references('business_id').inTable('business').onDelete('RESTRICT');
    t.bigInteger('product_id').notNullable()
      .references('product_id').inTable('product').onDelete('CASCADE');
    t.text('barcode_value').notNullable();
    t.boolean('is_primary').notNullable().defaultTo(false);
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    t.unique(['business_id', 'barcode_value']);
    t.unique(['product_id', 'barcode_value']);
  });

  // Partial unique index: only one primary barcode per product
  await knex.raw(`
    CREATE UNIQUE INDEX uq_product_barcode_primary
      ON product_barcode (product_id)
      WHERE is_primary = true
  `);

  // Lookup index
  await knex.raw(`CREATE INDEX idx_barcode_business_product ON product_barcode (business_id, product_id)`);
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('product_barcode');
};
