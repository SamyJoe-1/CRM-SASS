exports.up = (knex) => knex.schema.createTable('kpi_updates', (t) => {
  t.text('id').primary();
  t.text('tenant_id').notNullable().references('id').inTable('tenants').onDelete('CASCADE');
  t.text('kpi_id').notNullable().references('id').inTable('kpis').onDelete('CASCADE');
  t.text('updated_by').notNullable().references('id').inTable('users');
  t.real('previous_value').defaultTo(0);
  t.real('new_value').notNullable();
  t.text('notes');
  t.text('created_at').notNullable();
  t.text('updated_at').notNullable();
});
exports.down = (knex) => knex.schema.dropTableIfExists('kpi_updates');
