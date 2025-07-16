const { Pool } = require('pg');
require('dotenv').config();

// Configuración condicional para local/cloud
const poolConfig = process.env.DATABASE_URL 
  ? { // Configuración para ElephantSQL/Heroku/etc
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false
      }
    }
  : { // Configuración local de desarrollo
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'admin',
      database: process.env.DB_NAME || 'CampingDB',
      port: process.env.DB_PORT || 5432
    };

const pool = new Pool(poolConfig);

// Manejo de errores (importante para producción)
pool.on('error', (err) => {
  console.error('Error inesperado en el pool de PostgreSQL:', err);
  process.exit(-1);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  getClient: async () => await pool.connect(),
  end: () => pool.end()
};