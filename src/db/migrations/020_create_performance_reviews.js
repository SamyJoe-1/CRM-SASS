exports.up = (knex) => knex.schema.createTable('performance_reviews', (t) => {
  t.text('id').primary();
  t.text('tenant_id').notNullable().references('id').inTable('tenants').onDelete('CASCADE');
  t.text('employee_id').notNullable().references('id').inTable('employees').onDelete('CASCADE');
  t.text('reviewer_id').notNullable().references('id').inTable('users');
  t.text('period_label').notNullable();
  t.text('period_start').notNullable();
  t.text('period_end').notNullable();
  t.text('criteria_json');
  t.real('overall_score').defaultTo(0);
  t.text('comments');
  t.text('status').defaultTo('draft');
  t.text('submitted_at');
  t.text('acknowledged_at');
  t.text('deleted_at');
  t.text('created_at').notNullable();
  t.text('updated_at').notNullable();
});
exports.down = (knex) => knex.schema.dropTableIfExists('performance_reviews');
