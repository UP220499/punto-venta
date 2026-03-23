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

const BRANDING_COLS = ['business_name', 'business_subtitle', 'brand_logo_url', 'brand_primary_color', 'brand_surface_dark'];

async function getPublicBranding() {
  return knex('business_settings').select(BRANDING_COLS).first();
}

module.exports = { getSettings, updateSettings, getPublicBranding };
