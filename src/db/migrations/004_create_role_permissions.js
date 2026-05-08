exports.up = (knex) => knex.schema.createTable('role_permissions', (t) => {
  t.text('id').primary();
  t.text('role_id').notNullable().references('id').inTable('roles').onDelete('CASCADE');
  t.text('permission_id').notNullable().references('id').inTable('permissions').onDelete('CASCADE');
  t.text('created_at').notNullable();
  t.text('updated_at').notNullable();
  t.unique(['role_id','permission_id']);
});
exports.down = (knex) => knex.schema.dropTableIfExists('role_permissions');
