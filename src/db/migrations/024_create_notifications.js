exports.up = (knex) => knex.schema.createTable('notifications', (t) => {
  t.text('id').primary();
  t.text('tenant_id').notNullable().references('id').inTable('tenants').onDelete('CASCADE');
  t.text('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
  t.text('type').notNullable();
  t.text('title').notNullable();
  t.text('body');
  t.text('data_json');
  t.boolean('is_read').defaultTo(false);
  t.text('read_at');
  t.text('created_at').notNullable();
  t.text('updated_at').notNullable();
});
exports.down = (knex) => knex.schema.dropTableIfExists('notifications');
