'use strict';

const { knex } = require('../../config/db');

const AUDIT_COLS = [
  'audit_id',
  'event_code',
  'severity',
  'actor_user_id',
  'actor_username',
  'source',
  'entity_type',
  'entity_id',
  'message',
  'metadata',
  'created_at',
];

async function listAuditLogs(businessId, { page, pageSize, severity, eventCode, actorUserId, entityType, entityId, from, to }) {
  let query = knex('audit_log').where('business_id', businessId);

  if (severity)      query = query.where('severity', severity);
  if (eventCode)     query = query.where('event_code', eventCode);
  if (actorUserId)   query = query.where('actor_user_id', actorUserId);
  if (entityType)    query = query.where('entity_type', entityType);
  if (entityId)      query = query.where('entity_id', entityId);
  if (from)          query = query.whereRaw('created_at::date >= ?::date', [from]);
  if (to)            query = query.whereRaw('created_at::date <= ?::date', [to]);

  const [{ count }] = await query.clone().count('* as count');

  const items = await query
    .select(AUDIT_COLS)
    .orderBy('created_at', 'desc')
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  return { items, total: Number(count) };
}

module.exports = { listAuditLogs };
