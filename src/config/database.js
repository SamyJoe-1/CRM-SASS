const knex    = require('knex');
const configs = require('../../knexfile');
const env     = require('./env');

const db = knex(configs[env.NODE_ENV] || configs.development);
module.exports = db;
