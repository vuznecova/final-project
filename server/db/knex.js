// server/db/knex.js

const knex = require('knex');

const db = knex({
  client: 'mysql2',      // или 'mysql'
  connection: {
    host:     process.env.DB_HOST     || '127.0.0.1',
    user:     process.env.DB_USER     || 'root',
    password: process.env.DB_PASSWORD || 'Password123!',
    database: process.env.DB_NAME     || 'vr_application'
  },
  pool: { min: 0, max: 7 }
});

module.exports = db;
