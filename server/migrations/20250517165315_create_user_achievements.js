exports.up = function(knex) {
  return knex.schema.createTable('user_achievements', table => {
    table.increments('id');
    table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE');
    table.integer('type_id').unsigned().references('id').inTable('achievement_types').onDelete('CASCADE');
    table.timestamp('awarded_at').defaultTo(knex.fn.now());
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('user_achievements');
};
