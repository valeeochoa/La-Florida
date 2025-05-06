CREATE TABLE IF NOT EXISTS Persona (
    dni TEXT PRIMARY KEY,
    nombre TEXT NOT NULL,
    apellido TEXT NOT NULL,
    fecha_nacimiento TEXT,
    tipo TEXT CHECK(tipo IN ('Estudiante', 'Particular')) NOT NULL
);

CREATE TABLE IF NOT EXISTS Vehiculo (
    patente TEXT PRIMARY KEY,
    dni_titular TEXT UNIQUE,
    FOREIGN KEY (dni_titular) REFERENCES Persona(dni)
);

CREATE TABLE IF NOT EXISTS Movimiento (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    dni_persona TEXT,
    fecha TEXT NOT NULL,
    hora TEXT NOT NULL,
    tipo TEXT CHECK(tipo IN ('Ingreso', 'Egreso')) NOT NULL,
    monto REAL,
    FOREIGN KEY (dni_persona) REFERENCES Persona(dni)
);
