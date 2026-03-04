'use strict';

const knex = require('knex')(require('../../knexfile'));

async function ping() {
  await knex.raw('SELECT 1 AS ok');
}

module.exports = { knex, ping };
