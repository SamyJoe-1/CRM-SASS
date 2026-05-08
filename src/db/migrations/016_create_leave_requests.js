exports.up = (knex) => knex.schema.createTable('leave_requests', (t) => {
  t.text('id').primary();
  t.text('tenant_id').notNullable().references('id').inTable('tenants').onDelete('CASCADE');
  t.text('employee_id').notNullable().references('id').inTable('employees').onDelete('CASCADE');
  t.text('leave_type_id').notNullable().references('id').inTable('leave_types').onDelete('CASCADE');
  t.text('start_date').notNullable();
  t.text('end_date').notNullable();
  t.real('days_requested').notNullable();
  t.text('reason');
  t.text('status').defaultTo('pending');
  t.text('reviewed_by').references('id').inTable('users');
  t.text('reviewed_at');
  t.text('review_notes');
  t.text('deleted_at');
  t.text('created_at').notNullable();
  t.text('updated_at').notNullable();
});
exports.down = (knex) => knex.schema.dropTableIfExists('leave_requests');
