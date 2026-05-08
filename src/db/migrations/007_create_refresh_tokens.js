exports.up = (knex) => knex.schema.createTable('refresh_tokens', (t) => {
  t.text('id').primary();
  t.text('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
  t.text('token_hash').notNullable().unique();
  t.text('expires_at').notNullable();
  t.boolean('revoked').defaultTo(false);
  t.text('created_at').notNullable();
  t.text('updated_at').notNullable();
});
exports.down = (knex) => knex.schema.dropTableIfExists('refresh_tokens');
