'use strict';

exports.up = async function (knex) {
  await knex.schema.createTable('audit_log', (t) => {
    t.bigIncrements('audit_id').primary();
    t.bigInteger('business_id').notNullable()
      .references('business_id').inTable('business').onDelete('RESTRICT');
    t.text('event_code').notNullable();
    t.text('severity').notNullable().defaultTo('INFO');
    t.bigInteger('actor_user_id')
      .references('user_id').inTable('user').onDelete('SET NULL');
    t.text('actor_username');
    t.text('source');
    t.text('ip_address');
    t.text('user_agent');
    t.text('entity_type');
    t.bigInteger('entity_id');
    t.text('message').notNullable();
    t.jsonb('metadata');
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });

  await knex.raw(`
    ALTER TABLE audit_log
      ADD CONSTRAINT chk_al_severity CHECK (severity IN ('INFO', 'WARN', 'ERROR')),
      ADD CONSTRAINT chk_al_source   CHECK (source IS NULL OR source IN ('SYSTEM', 'API', 'UI'))
  `);

  await knex.raw(`CREATE INDEX idx_al_biz_created       ON audit_log (business_id, created_at DESC)`);
  await knex.raw(`CREATE INDEX idx_al_biz_event_created  ON audit_log (business_id, event_code, created_at DESC)`);
  await knex.raw(`CREATE INDEX idx_al_biz_actor_created  ON audit_log (business_id, actor_user_id, created_at DESC)`);
  await knex.raw(`CREATE INDEX idx_al_biz_entity         ON audit_log (business_id, entity_type, entity_id)`);
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('audit_log');
};
