exports.up = (knex) => knex.schema.createTable('departments', (t) => {
  t.text('id').primary();
  t.text('tenant_id').notNullable().references('id').inTable('tenants').onDelete('CASCADE');
  t.text('name').notNullable();
  t.text('name_ar');
  t.text('description');
  t.text('manager_id');
  t.text('deleted_at');
  t.text('created_at').notNullable();
  t.text('updated_at').notNullable();
});
exports.down = (knex) => knex.schema.dropTableIfExists('departments');
