'use strict';

const bcrypt = require('bcryptjs');

exports.seed = async function (knex) {
  // Find the default business
  const business = await knex('business').where('nombre', 'Negocio Demo').first();
  if (!business) return;

  const existing = await knex('user')
    .where({ business_id: business.business_id, username: 'admin' })
    .first();

  const password_hash = await bcrypt.hash('admin1234', 10);

  if (!existing) {
    await knex('user').insert({
      business_id: business.business_id,
      username: 'admin',
      password_hash,
      nombre: 'Administrador',
    });
  } else if (existing.password_hash === 'CHANGE_ME') {
    // Only replace the placeholder hash
    await knex('user')
      .where({ user_id: existing.user_id })
      .update({ password_hash });
  }
};
