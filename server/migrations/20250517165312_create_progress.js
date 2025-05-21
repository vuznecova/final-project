exports.up = function(knex) {
  return knex.schema.createTable('progress', table => {
    table.increments('id');
    table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE');
    table.integer('level').notNullable();
    table.integer('time_taken');
    table.integer('anxiety_rating');
    table.timestamp('completed_at');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('progress');
};
