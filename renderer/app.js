document.addEventListener('DOMContentLoaded', async () => {
  if (!window.electronAPI) {
    showFatalError('Error de conexión con el backend');
    return;
  }

  try {
    // Inicialización
    inicializarPestanias();
    inicializarOpcionesBusqueda();
    
    // Carga inicial de datos
    await cargarDatosIniciales();
    
    // Configuración inicial de UI
    document.getElementById('resultSection').style.display = 'none';
  } catch (error) {
    console.error('Error en inicialización:', error);
    mostrarMensaje(`Error: ${error.message}`, 'error');
  }
});

// ========== FUNCIONES DE INICIALIZACIÓN ==========

function inicializarPestanias() {
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Desactivar todas las pestañas
            tabs.forEach(t => t.classList.remove('active'));
            
            // Activar la pestaña clickeada
            tab.classList.add('active');
            
            // Cargar contenido específico
            cargarContenidoPestana(tab.textContent.trim());
        });
    });
}

function inicializarOpcionesBusqueda() {
    const options = document.querySelectorAll('.option');
    const dniInput = document.getElementById('dniInput');
    const searchButton = document.getElementById('searchButton');
    
    options.forEach(option => {
        option.addEventListener('click', () => {
            // Desactivar todas las opciones
            options.forEach(o => o.classList.remove('active'));
            
            // Activar la opción clickeada
            option.classList.add('active');
            
            // Actualizar la interfaz
            const optionText = option.textContent.trim();
            document.querySelector('.search-section h3').textContent = 
                `Ingrese el ${optionText === 'Vehículo' ? 'patente' : 'DNI'} del ${optionText.toUpperCase()}`;
            
            dniInput.placeholder = optionText === 'Vehículo' ? 'Ej: AB123CD' : 'Ej: 12345678';
        });
    });

    // Configurar eventos de búsqueda
    searchButton.addEventListener('click', buscarEnBaseDeDatos);
    dniInput.addEventListener('keypress', (e) => e.key === 'Enter' && buscarEnBaseDeDatos());
}

// ========== FUNCIONES PRINCIPALES ==========
async function buscarEnBaseDeDatos() {
  const input = document.getElementById('dniInput').value.trim();
  if (!input) {
    mostrarMensaje('Ingrese un valor válido', 'error');
    return;
  }

  const datoLimpio = input.replace(/[\.\-\s]/g, '');
  console.log('DNI/Patente procesado:', datoLimpio);

  const activeOption = document.querySelector('.option.active').textContent.trim();
  let metodoBusqueda;

  // Selección explícita del método
  switch(activeOption) {
    case 'Alumno':
      if (!window.electronAPI.buscarAlumnoPorDNI) {
        throw new Error('Método buscarAlumnoPorDNI no disponible');
      }
      metodoBusqueda = 'buscarAlumnoPorDNI';
      break;
    case 'Particular':
      if (!window.electronAPI.buscarParticularPorDNI) {
        throw new Error('Método buscarParticularPorDNI no disponible');
      }
      metodoBusqueda = 'buscarParticularPorDNI';
      break;
    case 'Vehículo':
      if (!window.electronAPI.buscarVehiculoPorPatente) {
        throw new Error('Método buscarVehiculoPorPatente no disponible');
      }
      metodoBusqueda = 'buscarVehiculoPorPatente';
      break;
    default:
      throw new Error('Opción de búsqueda no válida');
  }

  try {
    const resultados = await window.electronAPI[metodoBusqueda](datoLimpio);
    
    if (!resultados?.length) {
      mostrarMensaje(`No se encontraron resultados para ${datoLimpio}`, 'info');
    } else {
      mostrarResultados(resultados, activeOption);
    }
  } catch (error) {
    console.error('Error en búsqueda:', error);
    mostrarMensaje(`Error al buscar: ${error.message}`, 'error');
  }
}

// ========== FUNCIONES DE VISUALIZACIÓN ==========

function mostrarResultados(data, tipo) {
  const container = document.getElementById('resultSection');
  container.style.display = 'block';
  const contentDiv = container.querySelector('#resultContent') || document.createElement('div');
  contentDiv.id = 'resultContent';
  contentDiv.innerHTML = '';

  if (!data?.length) {
    contentDiv.innerHTML = '<p class="no-results">No se encontraron resultados</p>';
    container.appendChild(contentDiv);
    return;
  }

  const item = data[0];
  let html = '';

  // Plantilla con botones de movimiento
  const templates = {
    Alumno: `
      <div class="persona-card">
        <h3>${escapeHtml(item.p_nombre)} ${escapeHtml(item.p_apellido)}</h3>
        <div class="details">
          <p><strong>DNI:</strong> ${formatDNI(item.p_dni)}</p>
          <p><strong>Carrera:</strong> ${escapeHtml(item.a_carrera)}</p>
          <p><strong>Fecha Nacimiento:</strong> ${formatDate(item.a_fecnac)}</p>
          <p><strong>Tipo:</strong> Alumno</p>
        </div>
        <div class="movimientos-actions">
        <button id="btnIngreso" class="action-btn ingreso">Registrar Ingreso</button>
          <button id="btnEgreso" class="action-btn egreso">Registrar Egreso</button>
        </div>
        <div id="movimientosList" class="movimientos-list"></div>
      </div>
    `,
    Particular: `<div class="persona-card">
        <h3>${escapeHtml(item.p_nombre)} ${escapeHtml(item.p_apellido)}</h3>
        <div class="details">
          <p><strong>DNI:</strong> ${formatDNI(item.p_dni)}</p>
          <p><strong>Día de Ingreso:</strong> ${escapeHtml(item.p_diaingreso)}</p>
          <p><strong>Tipo:</strong> Particular</p>
          ${calcularTarifa(item.p_diaingreso)}
        </div>
        <div class="movimientos-actions">
          <button id="btnIngreso" class="action-btn ingreso">Registrar Ingreso</button>
          <button id="btnEgreso" class="action-btn egreso">Registrar Egreso</button>
        </div>
        <div id="movimientosList" class="movimientos-list"></div>
      </div>
    `, 
    Vehiculo: `<div class="vehiculo-card">
        <h3>Vehículo ${escapeHtml(item.v_patente)}</h3>
        <div class="details">
          <p><strong>Tipo:</strong> ${escapeHtml(item.v_tipo)}</p>
          <p><strong>Tarifa Vehículo:</strong> ${calcularTarifaVehiculo(item.v_tipo)}</p>
          <p><strong>Responsable:</strong> ${escapeHtml(item.p_nombre)} ${escapeHtml(item.p_apellido)}</p>
          <p><strong>DNI Responsable:</strong> ${formatDNI(item.p_dni_responsable)}</p>
        </div>
        <div class="movimientos-actions">
          <button id="btnIngreso" class="action-btn ingreso">Registrar Ingreso</button>
          <button id="btnEgreso" class="action-btn egreso">Registrar Egreso</button>
        </div>
        <div id="movimientosList" class="movimientos-list"></div>
      </div>
      `    
  };

  // Función auxiliar para calcular tarifa de particular
function calcularTarifa(diaIngreso) {
    let tarifa = 0;
    switch(diaIngreso) {
        case 'Viernes': tarifa = 3000; break;
        case 'Sabado': tarifa = 2000; break;
        case 'Domingo': tarifa = 1000; break;
        default: tarifa = 0;
    }
    return `<p><strong>Tarifa a pagar:</strong> $${tarifa}</p>`;
}
// Función auxiliar para calcular tarifa de vehículo
function calcularTarifaVehiculo(tipoVehiculo) {
    let tarifa = 0;
    switch(tipoVehiculo) {
        case 'Moto': tarifa = 1000; break;
        case 'Auto':
        case 'Camioneta': tarifa = 2000; break;
        case 'Motorhome': tarifa = 3000; break;
        default: tarifa = 0;
    }
    return `$${tarifa}`;
}

  if (!templates[tipo]) {
    console.error('Tipo de resultado no válido:', tipo);
    return;
  }

  contentDiv.innerHTML = templates[tipo];
  container.appendChild(contentDiv);

  if (tipo === 'Alumno' || tipo === 'Particular' || tipo === 'Vehiculo') {
  document.getElementById('btnIngreso').addEventListener('click', () => {
    registrarMovimiento(item, 'Ingreso');
  });
  
  document.getElementById('btnEgreso').addEventListener('click', () => {
    registrarMovimiento(item, 'Egreso');
  });
  
  cargarMovimientos(item.p_dni || item.p_dni_responsable);
}
}

async function registrarMovimiento(persona, tipo) {
  try {
    /* Validar fechas permitidas (19, 20 o 21)
    const hoy = new Date();
    const dia = hoy.getDate();
    
    if (dia < 19 || dia > 21) {
      mostrarMensaje('Solo se permiten movimientos los días 19, 20 y 21', 'error');
      return;
    }
*/
    const hoy = new Date();

    const movimiento = {
      fecha: hoy.toISOString().split('T')[0],
      hora: hoy.toTimeString().split(' ')[0],
      tipo: tipo,
      dni: persona.p_dni || persona.p_dni_responsable
    };

    const resultado = await window.electronAPI.registrarMovimiento(movimiento);
    if (resultado) {
      mostrarMensaje(`Movimiento de ${tipo} registrado correctamente`, 'success');
      cargarMovimientos(movimiento.dni);
    }
  } catch (error) {
    console.error('Error al registrar movimiento:', error);
    mostrarMensaje(`Error al registrar movimiento: ${error.message}`, 'error');
  }
}
// Funciones auxiliares de formato
function formatDNI(dni) {
    if (!dni) return 'N/A';
    try {
        return dni.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    } catch (error) {
        console.error('Error formateando DNI:', dni, error);
        return dni;
    }
}

function formatDate(dateString) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('es-AR', options);
}

function escapeHtml(unsafe) {
  if (!unsafe) return 'N/A';
  return unsafe.toString()
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function showFatalError(message) {
  document.body.innerHTML = `
    <div style="...estilos de error...">
      <h2>Error Crítico</h2>
      <p>${message}</p>
      <button onclick="window.location.reload()">Reintentar</button>
    </div>
  `;
}

/*/Verificar
function crearTablaAlumnos(container, Alumnos) {
    const tabla = document.createElement('table');
    tabla.className = 'resultados-table';
    
    tabla.innerHTML = `
        <thead>
            <tr>
                <th>DNI</th>
                <th>Nombre Completo</th>
                <th>Carrera</th>
                <th>Estado</th>
            </tr>
        </thead>
        <tbody>
            ${Alumnos.map(Alumno => `
                <tr>
                    <td>${Alumno.dni}</td>
                    <td>${Alumno.nombre} ${Alumno.apellido}</td>
                    <td>${Alumno.carrera}</td>
                    <td>${Alumno.estado}</td>
                </tr>
            `).join('')}
        </tbody>
    `;
    
    container.appendChild(tabla);
}

function crearCardVehiculo(container, vehiculo) {
    const div = document.createElement('div');
    div.className = 'vehiculo-info';
    div.innerHTML = `
        <h4>Información del vehículo</h4>
        <p><strong>Patente:</strong> ${vehiculo.patente}</p>
        <p><strong>Marca:</strong> ${vehiculo.marca}</p>
        <p><strong>Modelo:</strong> ${vehiculo.modelo}</p>
        <p><strong>Dueño:</strong> ${vehiculo.propietario}</p>
    `;
    container.appendChild(div);
}
*/
// ========== FUNCIONES AUXILIARES ==========

function crearContenedorResultados() {
    const container = document.createElement('div');
    container.id = 'resultadosContainer';
    container.className = 'resultados-container';
    document.querySelector('.search-section').appendChild(container);
    return container;
}

function mostrarMensaje(mensaje, tipo = 'info', timeout = 10000) {
  const mensajeDiv = document.createElement('div');
  mensajeDiv.className = `mensaje ${tipo}`;
  mensajeDiv.innerHTML = `
    <p>${mensaje}</p>
    ${tipo === 'error' ? '<button id="reload-btn">Reintentar</button>' : ''}
  `;
  
  const searchSection = document.querySelector('.search-section');
  const existingMsg = searchSection.querySelector('.mensaje');
  if (existingMsg) searchSection.removeChild(existingMsg);
  
  searchSection.appendChild(mensajeDiv);
  
  if (timeout > 0) {
    setTimeout(() => mensajeDiv.remove(), timeout);
  }

  // Manejo de botón de reintento para errores
  const reloadBtn = document.getElementById('reload-btn');
  if (reloadBtn) {
    reloadBtn.addEventListener('click', () => {
      window.location.reload();
    });
  }
}

async function cargarDatosIniciales() {
    try {
        const Alumnos = await window.electronAPI.obtenerAlumnos();
        console.log('Datos iniciales cargados:', Alumnos);
        // Aquí puedes procesar los datos iniciales si es necesario
    } catch (error) {
        console.error('Error cargando datos iniciales:', error);
        mostrarMensaje('Error al cargar datos iniciales', 'error');
    }
}
async function cargarMovimientos(dni) {
  try {
    const movimientos = await window.electronAPI.obtenerMovimientosPorDNI(dni);
    const movimientosList = document.getElementById('movimientosList');
    
    if (!movimientos?.length) {
      movimientosList.innerHTML = '<p>No hay movimientos registrados</p>';
      return;
    }

    let html = '<h4>Últimos movimientos:</h4><ul>';
    movimientos.forEach(mov => {
      html += `
        <li>
          ${mov.m_tipo} - ${formatDate(mov.m_fecha)} ${mov.m_hora}
        </li>
      `;
    });
    html += '</ul>';
    movimientosList.innerHTML = html;
  } catch (error) {
    console.error('Error al cargar movimientos:', error);
  }
}
function cargarContenidoPestana(pestana) {
  console.log(`Cambiando a pestaña: ${pestana}`);
  // Implementación básica (debes adaptarla)
  mostrarMensaje(`Mostrando ${pestana}`, 'info');
}

async function cargarReportes() {
    
}