'use strict';

exports.seed = async function (knex) {
  // Find the default business
  const business = await knex('business').where('nombre', 'Negocio Demo').first();
  if (!business) return;

  // Insert admin user if not exists
  const existing = await knex('user')
    .where({ business_id: business.business_id, username: 'admin' })
    .first();

  if (!existing) {
    await knex('user').insert({
      business_id: business.business_id,
      username: 'admin',
      password_hash: 'CHANGE_ME',
      nombre: 'Administrador',
    });
  }
};
