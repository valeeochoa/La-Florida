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
  end: () => pool.end(),
  buscarAlumnoPorDNI: async (dni) => {
    const query = `
      SELECT p.*, a.* 
      FROM Persona p
      JOIN Alumno a ON p.P_Dni = a.P_Dni
      WHERE p.P_Dni = $1`;
    const result = await pool.query(query, [dni]);
    return result.rows;
  },

  registrarMovimiento: async (movimiento) => {
    const query = `
      INSERT INTO Movimiento (M_Fecha, M_Hora, M_Tipo, P_Dni_Realizo)
      VALUES ($1, $2, $3, $4)
      RETURNING *`;
    const values = [
      movimiento.fecha,
      movimiento.hora,
      movimiento.tipo,
      movimiento.dni
    ];
    const result = await pool.query(query, values);
    return result.rows[0];
  },

  obtenerMovimientosPorDNI: async (dni) => {
    const query = `
      SELECT * FROM Movimiento
      WHERE P_Dni_Realizo = $1
      ORDER BY M_Fecha DESC, M_Hora DESC`;
    const result = await pool.query(query, [dni]);
    return result.rows;
  }
};