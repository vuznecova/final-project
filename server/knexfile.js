// knexfile.js
module.exports = {
    development: {
      client: 'mysql2',
      connection: {
        host     : '127.0.0.1',
        user     : 'root',
        password : 'Password123!',
        database : 'vr_application'
      },
      migrations: {
        directory: './migrations'
      },
      seeds: {
        directory: './seeds'
      }
    }
  };