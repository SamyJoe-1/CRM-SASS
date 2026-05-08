exports.up = (knex) => knex.schema.createTable('leave_types', (t) => {
  t.text('id').primary();
  t.text('tenant_id').notNullable().references('id').inTable('tenants').onDelete('CASCADE');
  t.text('name').notNullable();
  t.text('name_ar');
  t.integer('default_days').defaultTo(0);
  t.boolean('is_paid').defaultTo(true);
  t.boolean('requires_approval').defaultTo(true);
  t.text('deleted_at');
  t.text('created_at').notNullable();
  t.text('updated_at').notNullable();
});
exports.down = (knex) => knex.schema.dropTableIfExists('leave_types');
