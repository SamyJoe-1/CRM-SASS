exports.up = (knex) => knex.schema.createTable('employee_documents', (t) => {
  t.text('id').primary();
  t.text('tenant_id').notNullable().references('id').inTable('tenants').onDelete('CASCADE');
  t.text('employee_id').notNullable().references('id').inTable('employees').onDelete('CASCADE');
  t.text('name').notNullable();
  t.text('file_url').notNullable();
  t.text('file_type');
  t.integer('file_size');
  t.text('uploaded_by').references('id').inTable('users');
  t.text('deleted_at');
  t.text('created_at').notNullable();
  t.text('updated_at').notNullable();
});
exports.down = (knex) => knex.schema.dropTableIfExists('employee_documents');
