const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const db = require('./database/db');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,  // Mejor para seguridad
      contextIsolation: true   // Mejor para seguridad
    }
  });

  mainWindow.loadFile('renderer/index.html');

  // Opcional: Abrir herramientas de desarrollo en desarrollo
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Manejo de la base de datos
app.whenReady().then(() => {
  require('./database/db');
  createWindow();
});

// Eventos de IPC para la base de datos
ipcMain.handle('obtener-alumnos', async () => {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM alumnos', [], (err, rows) => {
      if (err) {
        console.error('Error consultando alumnos:', err.message);
        reject([]);
      } else {
        resolve(rows);
      }
    });
  });
});

// Cierre de la aplicación
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (mainWindow === null) createWindow();
});