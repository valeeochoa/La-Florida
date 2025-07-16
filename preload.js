const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  obtenerAlumnos: () => ipcRenderer.invoke('obtenerAlumnos'),
  buscarAlumnoPorDNI: (dni) => ipcRenderer.invoke('buscarAlumnoPorDNI', dni),
  buscarParticularPorDNI: (dni) => ipcRenderer.invoke('buscarParticularPorDNI', dni),
  buscarVehiculoPorPatente: (patente) => ipcRenderer.invoke('buscarVehiculoPorPatente', patente)
});

console.log('API Electron configurada');

/*const { contextBridge, ipcRenderer } = require('electron');

window._preloadReady = true;

contextBridge.exposeInMainWorld('electronAPI', {
    obtenerAlumnos: () => ipcRenderer.invoke('obtenerAlumnos'),
    buscarAlumnoPorDNI: (dni) => ipcRenderer.invoke('buscarAlumnoPorDNI', dni),
    buscarParticularPorDNI: (dni) => ipcRenderer.invoke('buscarParticularPorDNI', dni),
    buscarVehiculoPorPatente: (patente) => ipcRenderer.invoke('buscarVehiculoPorPatente', patente)
});
console.log('Preload configurado:', Object.keys(window.electronAPI || {}));


setTimeout(() => {
  console.log('Preload completamente cargado, API disponible:', 
    Object.keys(window.electronAPI || {}));
}, 1000);

console.log('Preload configurado correctamente');
process.on('loaded', () => {
  console.log('Preload completamente cargado');
});*/