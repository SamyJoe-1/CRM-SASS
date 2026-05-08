exports.up = (knex) => knex.schema.createTable('positions', (t) => {
  t.text('id').primary();
  t.text('tenant_id').notNullable().references('id').inTable('tenants').onDelete('CASCADE');
  t.text('department_id').references('id').inTable('departments');
  t.text('title').notNullable();
  t.text('title_ar');
  t.text('description');
  t.text('deleted_at');
  t.text('created_at').notNullable();
  t.text('updated_at').notNullable();
});
exports.down = (knex) => knex.schema.dropTableIfExists('positions');
