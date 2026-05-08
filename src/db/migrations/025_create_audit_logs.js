exports.up = (knex) => knex.schema.createTable('audit_logs', (t) => {
  t.text('id').primary();
  t.text('tenant_id').references('id').inTable('tenants').onDelete('SET NULL');
  t.text('user_id').references('id').inTable('users').onDelete('SET NULL');
  t.text('module').notNullable();
  t.text('action').notNullable();
  t.text('record_id');
  t.text('ip_address');
  t.text('user_agent');
  t.text('changes');
  t.text('created_at').notNullable();
  t.text('updated_at').notNullable();
});
exports.down = (knex) => knex.schema.dropTableIfExists('audit_logs');
