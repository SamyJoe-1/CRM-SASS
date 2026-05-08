require('dotenv').config();
const path = require('path');

module.exports = {
  development: {
    client: 'better-sqlite3',
    connection: { filename: process.env.DB_PATH || './crm.sqlite3' },
    useNullAsDefault: true,
    migrations: { directory: path.join(__dirname, 'src/db/migrations') },
    seeds:      { directory: path.join(__dirname, 'src/db/seeds') },
  },
  test: {
    client: 'better-sqlite3',
    connection: { filename: ':memory:' },
    useNullAsDefault: true,
    migrations: { directory: path.join(__dirname, 'src/db/migrations') },
    seeds:      { directory: path.join(__dirname, 'src/db/seeds') },
  },
  production: {
    client: 'better-sqlite3',
    connection: { filename: process.env.DB_PATH || './crm.sqlite3' },
    useNullAsDefault: true,
    migrations: { directory: path.join(__dirname, 'src/db/migrations') },
    seeds:      { directory: path.join(__dirname, 'src/db/seeds') },
  },
};
