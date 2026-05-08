exports.up = (knex) => knex.schema.createTable('announcements', (t) => {
  t.text('id').primary();
  t.text('tenant_id').notNullable().references('id').inTable('tenants').onDelete('CASCADE');
  t.text('created_by').notNullable().references('id').inTable('users');
  t.text('title').notNullable();
  t.text('title_ar');
  t.text('body').notNullable();
  t.text('body_ar');
  t.text('status').defaultTo('draft');
  t.text('published_at');
  t.text('audience').defaultTo('all');
  t.text('department_id').references('id').inTable('departments');
  t.text('deleted_at');
  t.text('created_at').notNullable();
  t.text('updated_at').notNullable();
});
exports.down = (knex) => knex.schema.dropTableIfExists('announcements');
