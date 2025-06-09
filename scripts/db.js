const { Pool } = require('pg');
const pool = new Pool({
  user: 'rthh',
  host: 'localhost',
  database: 'magazin_adidasi',
  password: 'rthh',
  port: 5432,
});
module.exports = pool;
