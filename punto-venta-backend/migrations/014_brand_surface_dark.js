'use strict';

exports.up = async function (knex) {
  await knex.schema.alterTable('business_settings', (t) => {
    t.text('brand_surface_dark').nullable().defaultTo(null);
  });
};

exports.down = async function (knex) {
  await knex.schema.alterTable('business_settings', (t) => {
    t.dropColumn('brand_surface_dark');
  });
};
