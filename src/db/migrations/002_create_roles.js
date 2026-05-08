exports.up = (knex) => knex.schema.createTable('roles', (t) => {
  t.text('id').primary();
  t.text('tenant_id').references('id').inTable('tenants').onDelete('CASCADE');
  t.text('name').notNullable();
  t.text('display_name');
  t.text('description');
  t.boolean('is_system').defaultTo(false);
  t.text('deleted_at');
  t.text('created_at').notNullable();
  t.text('updated_at').notNullable();
});
exports.down = (knex) => knex.schema.dropTableIfExists('roles');
