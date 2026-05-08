exports.up = (knex) => knex.schema.createTable('user_permissions', (t) => {
  t.text('id').primary();
  t.text('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
  t.text('permission_id').notNullable().references('id').inTable('permissions').onDelete('CASCADE');
  t.text('type').notNullable().checkIn(['grant','deny']);
  t.text('created_at').notNullable();
  t.text('updated_at').notNullable();
  t.unique(['user_id','permission_id']);
});
exports.down = (knex) => knex.schema.dropTableIfExists('user_permissions');
