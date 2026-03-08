'use strict';

const { knex } = require('../../config/db');

async function getSettings(businessId) {
  return knex('business_settings').where({ business_id: businessId }).first();
}

async function updateSettings(businessId, patch, updatedBy) {
  const [row] = await knex('business_settings')
    .where({ business_id: businessId })
    .update({
      ...patch,
      updated_by: updatedBy,
      updated_at: knex.fn.now(),
    })
    .returning('*');
  return row;
}

module.exports = { getSettings, updateSettings };
