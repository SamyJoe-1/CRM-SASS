exports.up = (knex) => knex.schema.createTable('attendance_policies', (t) => {
  t.text('id').primary();
  t.text('tenant_id').notNullable().references('id').inTable('tenants').onDelete('CASCADE').unique();
  t.text('work_start_time').defaultTo('09:00');
  t.text('work_end_time').defaultTo('18:00');
  t.integer('grace_minutes').defaultTo(15);
  t.integer('working_days_per_week').defaultTo(5);
  t.text('working_days_json').defaultTo('[1,2,3,4,5]');
  t.text('allowed_ips_encrypted');
  t.text('allowed_ssids_encrypted');
  t.boolean('enforce_network_check').defaultTo(false);
  t.text('deleted_at');
  t.text('created_at').notNullable();
  t.text('updated_at').notNullable();
});
exports.down = (knex) => knex.schema.dropTableIfExists('attendance_policies');
