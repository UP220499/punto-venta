'use strict';

exports.up = async function (knex) {
  await knex.schema.createTable('business_settings', (t) => {
    t.bigInteger('business_id').primary()
      .references('business_id').inTable('business').onDelete('CASCADE');

    // Folio config
    t.text('ticket_folio_prefix');
    t.bigInteger('ticket_folio_next').notNullable().defaultTo(1);
    t.integer('ticket_folio_padding').notNullable().defaultTo(6);

    // Tax config
    t.boolean('tax_enabled').notNullable().defaultTo(false);
    t.decimal('tax_rate', 6, 4).notNullable().defaultTo(0);
    t.boolean('tax_included_in_price').notNullable().defaultTo(false);

    // Currency config
    t.text('currency_code').notNullable().defaultTo('MXN');
    t.text('currency_symbol').notNullable().defaultTo('$');
    t.integer('decimal_places').notNullable().defaultTo(2);

    // General
    t.text('timezone').notNullable().defaultTo('America/Mexico_City');

    // Ticket display
    t.text('ticket_header_text');
    t.text('ticket_footer_text');
    t.integer('ticket_paper_width').notNullable().defaultTo(58);
    t.boolean('show_tax_breakdown').notNullable().defaultTo(false);
    t.boolean('show_cashier_name').notNullable().defaultTo(true);
    t.boolean('show_barcode_on_ticket').notNullable().defaultTo(true);

    // Inventory defaults
    t.integer('default_stock_minimo').notNullable().defaultTo(0);
    t.text('default_unidad').notNullable().defaultTo('pz');

    // Payment defaults
    t.boolean('require_transfer_reference').notNullable().defaultTo(false);

    // Audit
    t.bigInteger('updated_by')
      .references('user_id').inTable('user').onDelete('SET NULL');
    t.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });

  await knex.raw(`
    ALTER TABLE business_settings
      ADD CONSTRAINT chk_ticket_folio_next    CHECK (ticket_folio_next >= 1),
      ADD CONSTRAINT chk_ticket_folio_padding CHECK (ticket_folio_padding >= 0),
      ADD CONSTRAINT chk_tax_rate             CHECK (tax_rate >= 0),
      ADD CONSTRAINT chk_decimal_places       CHECK (decimal_places >= 0 AND decimal_places <= 4),
      ADD CONSTRAINT chk_ticket_paper_width   CHECK (ticket_paper_width IN (58, 80)),
      ADD CONSTRAINT chk_default_stock_minimo CHECK (default_stock_minimo >= 0)
  `);
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('business_settings');
};
