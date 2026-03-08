'use strict';

const repo = require('./settings.repository');

function notFound() {
  const err = new Error('Business settings not found');
  err.statusCode = 404;
  err.code = 'SETTINGS_NOT_FOUND';
  return err;
}

async function getSettings(businessId) {
  const row = await repo.getSettings(businessId);
  if (!row) throw notFound();
  return row;
}

async function updateSettings(businessId, patch, updatedBy) {
  // Ensure the record exists before updating
  const existing = await repo.getSettings(businessId);
  if (!existing) throw notFound();

  const row = await repo.updateSettings(businessId, patch, updatedBy);
  if (!row) throw notFound();
  return row;
}

module.exports = { getSettings, updateSettings };
