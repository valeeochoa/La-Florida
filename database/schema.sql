-- Creación de la base de datos (ejecutar primero en psql o pgAdmin)
CREATE DATABASE CampingDB;
-- Conexión a la base de datos (debes ejecutar esto después de crear la DB)
\c CampingDB
-- Creación de la tabla Persona (entidad principal)
CREATE TABLE Persona (
    P_Dni INT PRIMARY KEY,
    P_Nombre VARCHAR(100) NOT NULL,
    P_Apellido VARCHAR(100) NOT NULL,
    P_Tipo VARCHAR(10) NOT NULL CHECK (P_Tipo IN ('Alumno', 'Particular'))
);

-- Creación de la tabla Alumno (subentidad de Persona)
CREATE TABLE Alumno (
    P_Dni INT PRIMARY KEY,
    A_Carrera VARCHAR(100) NOT NULL,
    A_FecNac DATE NOT NULL,
    FOREIGN KEY (P_Dni) REFERENCES Persona(P_Dni)
);

-- Creación de la tabla Particular (subentidad de Persona)
CREATE TABLE Particular (
    P_Dni INT PRIMARY KEY,
    P_DiaIngreso VARCHAR(10) NOT NULL CHECK (P_DiaIngreso IN ('Viernes', 'Sabado', 'Domingo')),
    FOREIGN KEY (P_Dni) REFERENCES Persona(P_Dni)
);

-- Creación de la tabla Vehículo
CREATE TABLE Vehiculo (
    V_Patente VARCHAR(20) PRIMARY KEY,
    V_Tipo VARCHAR(10) NOT NULL CHECK (V_Tipo IN ('Moto', 'Auto', 'Camioneta', 'Motorhome')),
    P_Dni_Responsable INT NOT NULL,
    FOREIGN KEY (P_Dni_Responsable) REFERENCES Persona(P_Dni)
);

-- Creación de la tabla Movimiento
CREATE TABLE Movimiento (
    M_Id SERIAL PRIMARY KEY, --clave artificial 
    M_Fecha DATE NOT NULL,
    M_Hora TIME NOT NULL,
    M_Tipo VARCHAR(10) NOT NULL CHECK (M_Tipo IN ('Ingreso', 'Egreso')),
    P_Dni_Realizo INT NOT NULL,
    FOREIGN KEY (P_Dni_Realizo) REFERENCES Persona(P_Dni)
);

-- Datos iniciales
INSERT INTO Persona (P_Dni, P_Nombre, P_Apellido, P_Tipo) VALUES 
(12345678, 'Juan', 'Perez', 'Alumno'),
(87654321, 'Maria', 'Gomez', 'Particular');

INSERT INTO Alumno (P_Dni, A_Carrera, A_FecNac) VALUES
(12345678, 'Ingeniería', '2000-01-01');

INSERT INTO Particular (P_Dni, P_DiaIngreso) VALUES
(87654321, 'Sabado');