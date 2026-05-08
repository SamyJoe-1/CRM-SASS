exports.up = (knex) => knex.schema.createTable('payslips', (t) => {
  t.text('id').primary();
  t.text('tenant_id').notNullable().references('id').inTable('tenants').onDelete('CASCADE');
  t.text('payroll_record_id').notNullable().references('id').inTable('payroll_records').onDelete('CASCADE').unique();
  t.text('employee_id').notNullable().references('id').inTable('employees');
  t.text('pdf_url');
  t.boolean('viewed_by_employee').defaultTo(false);
  t.text('viewed_at');
  t.text('created_at').notNullable();
  t.text('updated_at').notNullable();
});
exports.down = (knex) => knex.schema.dropTableIfExists('payslips');
