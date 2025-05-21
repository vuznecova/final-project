exports.up = function(knex) {
  return knex.schema.createTable('achievement_types', table => {
    table.increments('id');
    table.string('code').notNullable().unique();      // e.g. lvl1_complete
    table.string('name').notNullable();               // e.g. "Level 1 Complete"
    table.string('description');
    table.string('icon_path');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('achievement_types');
};
