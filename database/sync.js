const { Pool } = require('pg');
require('dotenv').config();

// Configuración mejorada para PostgreSQL
const pgConfig = process.env.DATABASE_URL 
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    }
  : {
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME || 'CampingDB',
      port: process.env.DB_PORT || 5432
    };

class SyncService {
  constructor() {
    this.pool = new Pool(pgConfig);
  }

  async checkPendingRecords() {
    const client = await this.pool.connect();
    try {
      // Verificar movimientos pendientes (ejemplo)
      const result = await client.query(
        `SELECT COUNT(*) FROM Movimiento 
         WHERE sincronizado = false OR sincronizado IS NULL`
      );
      return parseInt(result.rows[0].count);
    } finally {
      client.release();
    }
  }

  async syncData() {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      // 1. Sincronizar estudiantes
      await client.query(`
        INSERT INTO personas (dni, nombre, apellido, tipo)
        SELECT dni, nombre, apellido, 'Estudiante'
        FROM estudiantes_temp
        WHERE NOT EXISTS (
          SELECT 1 FROM personas WHERE personas.dni = estudiantes_temp.dni
        )
      `);

      // 2. Sincronizar movimientos
      await client.query(`
        INSERT INTO movimiento (dni_persona, tipo, fecha, hora)
        SELECT dni_persona, tipo, fecha, hora
        FROM movimientos_temp
        WHERE NOT sincronizado
        RETURNING id
      `);

      // 3. Marcar como sincronizado
      await client.query(`
        UPDATE movimientos_temp
        SET sincronizado = true
        WHERE id IN (
          SELECT id FROM movimientos_temp
          WHERE NOT sincronizado
          LIMIT 1000
        )
      `);

      await client.query('COMMIT');
      console.log('✅ Datos sincronizados correctamente');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async start() {
   try {
      const pending = await this.checkPendingRecords();
      
      if (pending > 0) {
        console.log(`Sincronizando ${pending} registros...`);
        await this.syncData();
      } else {
        console.log('No hay registros pendientes');
      }
    } catch (error) {
      console.error('Error en sincronización:', error.message);
    }
  }

  async stop() {
    await this.pool.end();
  }
}

// Uso del servicio
const syncService = new SyncService();

syncService.start()
  .then(() => console.log('Servicio de sincronización iniciado'))
  .catch(err => console.error('Error inicial:', err));

// Manejo de cierre limpio
process.on('SIGINT', async () => {
  await syncService.stop();
  process.exit();
});

process.on('SIGTERM', async () => {
  await syncService.stop();
  process.exit();
});

module.exports = { syncService };