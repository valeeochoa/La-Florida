const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'camping.db');
const db = new sqlite3.Database(dbPath);

const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');

db.serialize(() => {
  db.exec(schema, (err) => {
    if (err) console.error('Error creando tablas:', err.message);
    else console.log('Base de datos lista.');
  });
});

module.exports = db;
