exports.up = (knex) => knex.schema.createTable('tenants', (t) => {
  t.text('id').primary();
  t.text('name').notNullable();
  t.text('slug').notNullable().unique();
  t.text('language').defaultTo('en');
  t.text('timezone').defaultTo('UTC');
  t.text('logo_url');
  t.text('address');
  t.text('phone');
  t.text('email');
  t.boolean('is_active').defaultTo(true);
  t.text('deleted_at');
  t.text('created_at').notNullable();
  t.text('updated_at').notNullable();
});
exports.down = (knex) => knex.schema.dropTableIfExists('tenants');
