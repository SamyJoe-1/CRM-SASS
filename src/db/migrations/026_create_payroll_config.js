exports.up = (knex) => knex.schema.createTable('payroll_configs', (t) => {
  t.text('id').primary();
  t.text('tenant_id').notNullable().references('id').inTable('tenants').onDelete('CASCADE').unique();
  t.real('insurance_rate').defaultTo(0.11);
  t.real('insurance_cap').defaultTo(50000);
  t.text('tax_brackets');
  t.integer('working_days_per_month').defaultTo(22);
  t.text('created_at').notNullable();
  t.text('updated_at').notNullable();
});
exports.down = (knex) => knex.schema.dropTableIfExists('payroll_configs');
