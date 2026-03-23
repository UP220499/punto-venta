'use strict';

exports.up = async function (knex) {
  await knex.schema.alterTable('business_settings', (t) => {
    t.text('business_name').notNullable().defaultTo('Mi Negocio');
    t.text('business_subtitle').nullable().defaultTo(null);
    t.text('brand_logo_url').nullable().defaultTo(null);
    t.text('brand_primary_color').nullable().defaultTo(null);
    t.text('brand_surface_dark').nullable().defaultTo(null);
  });
};

exports.down = async function (knex) {
  await knex.schema.alterTable('business_settings', (t) => {
    t.dropColumn('business_name');
    t.dropColumn('business_subtitle');
    t.dropColumn('brand_logo_url');
    t.dropColumn('brand_primary_color');
    t.dropColumn('brand_surface_dark');
  });
};
