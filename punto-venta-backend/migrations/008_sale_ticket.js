'use strict';

exports.up = async function (knex) {
  await knex.schema.createTable('sale_ticket', (t) => {
    t.bigIncrements('ticket_id').primary();
    t.bigInteger('business_id').notNullable()
      .references('business_id').inTable('business').onDelete('RESTRICT');
    t.bigInteger('folio');
    t.text('estatus').notNullable().defaultTo('BORRADOR');
    t.bigInteger('created_by').notNullable()
      .references('user_id').inTable('user').onDelete('RESTRICT');
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.timestamp('closed_at', { useTz: true });
    t.decimal('subtotal', 12, 2).notNullable().defaultTo(0);
    t.decimal('descuento_total', 12, 2).notNullable().defaultTo(0);
    t.decimal('impuestos_total', 12, 2).notNullable().defaultTo(0);
    t.decimal('total', 12, 2).notNullable().defaultTo(0);
    t.decimal('cambio', 12, 2).notNullable().defaultTo(0);
  });

  await knex.raw(`
    ALTER TABLE sale_ticket
      ADD CONSTRAINT chk_sale_ticket_estatus       CHECK (estatus IN ('BORRADOR', 'CERRADO')),
      ADD CONSTRAINT chk_sale_ticket_subtotal      CHECK (subtotal >= 0),
      ADD CONSTRAINT chk_sale_ticket_descuento     CHECK (descuento_total >= 0),
      ADD CONSTRAINT chk_sale_ticket_impuestos     CHECK (impuestos_total >= 0),
      ADD CONSTRAINT chk_sale_ticket_total         CHECK (total >= 0),
      ADD CONSTRAINT chk_sale_ticket_cambio        CHECK (cambio >= 0),
      ADD CONSTRAINT chk_sale_ticket_closed        CHECK (
        (estatus <> 'CERRADO') OR (closed_at IS NOT NULL AND total > 0)
      )
  `);

  // Partial unique: folio only unique within business when not null
  await knex.raw(`
    CREATE UNIQUE INDEX uq_sale_ticket_business_folio
      ON sale_ticket (business_id, folio)
      WHERE folio IS NOT NULL
  `);

  await knex.raw(`CREATE INDEX idx_sale_ticket_biz_created ON sale_ticket (business_id, created_at DESC)`);
  await knex.raw(`CREATE INDEX idx_sale_ticket_biz_closed  ON sale_ticket (business_id, closed_at DESC)`);
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('sale_ticket');
};
