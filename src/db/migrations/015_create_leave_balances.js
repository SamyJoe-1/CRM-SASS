exports.up = (knex) => knex.schema.createTable('leave_balances', (t) => {
  t.text('id').primary();
  t.text('tenant_id').notNullable().references('id').inTable('tenants').onDelete('CASCADE');
  t.text('employee_id').notNullable().references('id').inTable('employees').onDelete('CASCADE');
  t.text('leave_type_id').notNullable().references('id').inTable('leave_types').onDelete('CASCADE');
  t.integer('year').notNullable();
  t.real('total_days').defaultTo(0);
  t.real('used_days').defaultTo(0);
  t.real('pending_days').defaultTo(0);
  t.text('deleted_at');
  t.text('created_at').notNullable();
  t.text('updated_at').notNullable();
  t.unique(['employee_id','leave_type_id','year']);
});
exports.down = (knex) => knex.schema.dropTableIfExists('leave_balances');
