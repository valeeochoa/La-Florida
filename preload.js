const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    obtenerAlumnos: () => ipcRenderer.invoke('obtener-alumnos'),
    buscarAlumnoPorDNI: (dni) => ipcRenderer.invoke('buscarAlumnoPorDNI', dni),
    buscarParticularPorDNI: (dni) => ipcRenderer.invoke('buscarParticularPorDNI', dni),
    buscarVehiculoPorPatente: (patente) => ipcRenderer.invoke('buscarVehiculoPorPatente', patente)
});