'use strict';

exports.seed = async function (knex) {
  // Resolve admin user
  const user = await knex('user').where('username', 'admin').first();
  if (!user) return;

  // Resolve ADMIN role
  const role = await knex('role').where('code', 'ADMIN').first();
  if (!role) return;

  await knex('user_role')
    .insert({ user_id: user.user_id, role_id: role.role_id })
    .onConflict(['user_id', 'role_id'])
    .ignore();
};
