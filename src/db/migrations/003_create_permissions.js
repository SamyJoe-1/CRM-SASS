exports.up = (knex) => knex.schema.createTable('permissions', (t) => {
  t.text('id').primary();
  t.text('key').notNullable().unique();
  t.text('module').notNullable();
  t.text('action').notNullable();
  t.text('description');
  t.text('created_at').notNullable();
  t.text('updated_at').notNullable();
});
exports.down = (knex) => knex.schema.dropTableIfExists('permissions');
