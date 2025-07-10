const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();
const csv = require('csv-parser');
const path = require('path');

const dbPath = path.join(__dirname, 'camping.db');
const csvPath = path.join(__dirname, 'alumnos.csv');

const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS alumnos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    apellido TEXT,
    nombres TEXT,
    carrera TEXT,
    fecha_nacimiento TEXT,
    documento TEXT UNIQUE,
    ingreso BOOLEAN DEFAULT 0
  )`);

  fs.createReadStream(csvPath)
    .pipe(csv())
    .on('data', (row) => {
      db.run(
        `INSERT OR IGNORE INTO alumnos (apellido, nombres, carrera, fecha_nacimiento, documento) VALUES (?, ?, ?, ?, ?)`,
        [row.apellido, row.nombres, row.carrera, row['fecha nacimiento'], row.documento]
      );
    })
    .on('end', () => {
      console.log('✅ Datos cargados en la base de datos.');
    });
});
