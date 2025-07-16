// Añadir al inicio del archivo
require('dotenv').config();
console.log('Entorno:', process.env.NODE_ENV || 'development');

const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const {startSyncService}=require('./database/sync');

const db = require('./database/db');
const { syncService } = require('./database/sync');
let mainWindow;

app.on('ready', () => {
  console.log('Evento ready disparado, creando ventana...');
});

function createWindow() {
  console.log('Creando ventana...');
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    show: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false, 
      contextIsolation: true, 
      sandbox: true,
      worldSafeExecuteJavaScript: true 
    }
  });

   // Mover todos los event listeners dentro de la función
 mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));

  //Manejo de errores de carga
  mainWindow.webContents.on('did-fail-load', () => {
    console.error('Error al cargar el contenido');
    mainWindow.close();
  });

  // Opcional: Abrir herramientas de desarrollo en desarrollo
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }
  console.log('Ruta del preload:', path.join(__dirname, 'preload.js'));

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(async () => {
  try {
    // Registrar handlers ANTES de crear la ventana
    registerIPCHandlers();
    createWindow();
    
    if (process.env.NODE_ENV !== 'test') {
      // await startSyncService(); // Descomentar si es necesario
    }
  } catch (error) {
    console.error('Error durante la inicialización:', error);
    app.quit();
  }
});

// =============================================
// Handlers IPC para operaciones de base de datos
// =============================================

function registerIPCHandlers() {

ipcMain.handle('obtenerAlumnos', async () => {
  try {
    const { rows } = await db.query(
      `SELECT p.p_dni, p.p_nombre, p.p_apellido, a.a_carrera, a.a_fecnac
       FROM persona p
       JOIN alumno a ON p.p_dni = a.p_dni
       WHERE p.p_tipo = 'Alumno'`
    );
    return rows;
  } catch (error) {
    console.error('Error al obtener alumnos:', error);
    throw new Error('No se pudieron cargar los alumnos');
  }
});

// Antes de crear la ventana, registra TODOS los handlers
ipcMain.handle('buscarAlumnoPorDNI', async (event, dni) => {
  if (!/^\d{7,8}$/.test(dni)) {
    throw new Error('DNI inválido. Debe contener 7 u 8 dígitos');
  }

  try {
    const { rows } = await db.query(
     `SELECT p.p_dni, p.p_nombre, p.p_apellido, a.a_carrera, a.a_fecnac
       FROM persona p
       JOIN alumno a ON p.p_dni = a.p_dni
       WHERE p.p_dni = $1 AND p.p_tipo = 'Alumno'`,
      [dni]
    );
    return rows;
  } catch (error) {
    console.error(`Error buscando alumno DNI ${dni}:`, error);
    throw new Error('Error al buscar alumno');
  }

});

ipcMain.handle('buscarParticularPorDNI', async (event, dni) => {
  try {
    const { rows } = await db.query(
    `SELECT p.p_dni, p.p_nombre, p.p_apellido, par.p_diaingreso
       FROM persona p
       JOIN particular par ON p.p_dni = par.p_dni
       WHERE p.p_dni = $1 AND p.p_tipo = 'Particular'`,
    [dni]
    );
   return rows;
  } catch (error) {
    console.error(`Error buscando particular DNI ${dni}:`, error);
    throw new Error('Error al buscar particular');
  }
});

ipcMain.handle('buscarVehiculoPorPatente', async (event, patente) => {
  try {
    const { rows } = await db.query(
      `SELECT 
        v.v_patente,
        v.v_tipo,
        v.p_dni_responsable,
        p.p_nombre as titular_nombre,
        p.p_apellido as titular_apellido
       FROM vehiculo v
       JOIN persona p ON v.p_dni_responsable = p.p_dni
       WHERE v.v_patente = $1`,
      [patente.toUpperCase()] // Normalizar a mayúsculas
    );
    return rows;
  } catch (error) {
    console.error(`Error buscando vehículo patente ${patente}:`, error);
    throw new Error('Error al buscar vehículo');
  }
});

ipcMain.handle('registrar-movimiento', async (event, { tipo, dni }) => { // ✅ Desestructuración
  const hoy = new Date();
  const dia = hoy.getDate();
  
  if (![19, 20, 21].includes(dia)) {
    throw new Error('Solo se permiten movimientos los días 19, 20 o 21 del mes');
  }

  if (!['Ingreso', 'Egreso'].includes(tipo)) {
    throw new Error('Tipo de movimiento inválido');
  }

  try {
    const { rows } = await db.query(
      `INSERT INTO Movimiento 
       (fecha, hora, tipo, dni_persona)
       VALUES (CURRENT_DATE, CURRENT_TIME, $1, $2)
       RETURNING *`,
      [tipo, dni]
    );
    return rows[0];
  } catch (error) {
    console.error('Error registrando movimiento:', error);
    throw error;
  }
});
}

// Cierre de la aplicación
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (mainWindow === null) createWindow();
});
