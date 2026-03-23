'use strict';

exports.seed = async function (knex) {
  // Insert default business if none exists
  const existing = await knex('business').where('nombre', 'Negocio Demo').first();

  let businessId;

  if (!existing) {
    const [row] = await knex('business')
      .insert({ nombre: 'Negocio Demo' })
      .returning('business_id');
    businessId = row.business_id;
  } else {
    businessId = existing.business_id;
  }

  // Insert default settings (all defaults come from the table definition)
  const settingsExist = await knex('business_settings')
    .where('business_id', businessId)
    .first();

  if (!settingsExist) {
    await knex('business_settings').insert({
      business_id: businessId,
      business_name: 'El Potrillo',
      business_subtitle: 'Internacional de Llantas',
      brand_logo_url: '/branding/el-potrillo-logo.png',
      brand_primary_color: '#A52222',
      brand_surface_dark: '#111827',
    });
  }
};
