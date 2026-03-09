'use strict';

const repo = require('./audit.repository');
const { parse, listAuditQuery } = require('./audit.schemas');

async function listAuditLogs(businessId, rawQuery) {
  const q = parse(listAuditQuery, rawQuery);

  const { items, total } = await repo.listAuditLogs(businessId, {
    page:        q.page,
    pageSize:    q.page_size,
    severity:    q.severity    ?? null,
    eventCode:   q.event_code  ?? null,
    actorUserId: q.actor_user_id ?? null,
    entityType:  q.entity_type ?? null,
    entityId:    q.entity_id   ?? null,
    from:        q.from        ?? null,
    to:          q.to          ?? null,
  });

  return { items, page: q.page, page_size: q.page_size, total };
}

module.exports = { listAuditLogs };
