exports.up = (knex) => knex.schema.createTable('payroll_cycles', (t) => {
  t.text('id').primary();
  t.text('tenant_id').notNullable().references('id').inTable('tenants').onDelete('CASCADE');
  t.integer('year').notNullable();
  t.integer('month').notNullable();
  t.text('status').defaultTo('draft');
  t.text('processed_at');
  t.text('processed_by').references('id').inTable('users');
  t.text('notes');
  t.text('deleted_at');
  t.text('created_at').notNullable();
  t.text('updated_at').notNullable();
  t.unique(['tenant_id','year','month']);
});
exports.down = (knex) => knex.schema.dropTableIfExists('payroll_cycles');
