const { Pool } = require('pg');
const pool = new Pool({
  user: 'rthh',
  host: 'localhost',
  database: 'magazin_adidasi',
  password: 'rthh',
  port: 5432,
});

// Test the connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Database connection error:', err.message);
  } else {
    console.log('Database connected successfully at:', res.rows[0].now);
  }
});

module.exports = pool;
