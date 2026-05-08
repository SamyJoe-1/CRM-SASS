exports.up = (knex) => knex.schema.createTable('attendance_records', (t) => {
  t.text('id').primary();
  t.text('tenant_id').notNullable().references('id').inTable('tenants').onDelete('CASCADE');
  t.text('employee_id').notNullable().references('id').inTable('employees').onDelete('CASCADE');
  t.text('date').notNullable();
  t.text('clock_in_at');
  t.text('clock_out_at');
  t.integer('worked_minutes').defaultTo(0);
  t.integer('overtime_minutes').defaultTo(0);
  t.integer('late_minutes').defaultTo(0);
  t.text('status').defaultTo('present');
  t.text('notes');
  t.text('edited_by').references('id').inTable('users');
  t.text('deleted_at');
  t.text('created_at').notNullable();
  t.text('updated_at').notNullable();
  t.unique(['tenant_id','employee_id','date']);
});
exports.down = (knex) => knex.schema.dropTableIfExists('attendance_records');
