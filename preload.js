const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('api', {
  // funciones JS que conectarán con db.js más adelante
});
