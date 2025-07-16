const { ipcRenderer } = require('electron');

window.addEventListener('DOMContentLoaded', () => {
  ipcRenderer.invoke('obtener-alumnos').then((alumnos) => {
    const contenedor = document.getElementById('lista-alumnos');
    alumnos.forEach(alumno => {
      const fila = document.createElement('tr');
      fila.innerHTML = `
        <td>${alumno.dni}</td>
        <td>${alumno.apellido}</td>
        <td>${alumno.nombres}</td>
        <td>${alumno.carrera}</td>
        <td>${alumno.fecha_nacimiento}</td>
        <td>${alumno.Ingreso ? 'Sí' : 'No'}</td>
      `;
      contenedor.appendChild(fila);
    });
  });
});
