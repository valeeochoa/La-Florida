document.addEventListener('DOMContentLoaded', async () => {
    // Manejo de pestañas
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            // Aquí puedes cargar contenido diferente según la pestaña
            cargarContenidoPestana(tab.textContent.trim());
        });
    });

    // Manejo de opciones (Alumno/Particular/Vehículo)
    const options = document.querySelectorAll('.option');
    options.forEach(option => {
        option.addEventListener('click', () => {
            options.forEach(o => o.classList.remove('active'));
            option.classList.add('active');
            
            const optionText = option.textContent.trim();
            document.querySelector('.search-section h3').textContent = 
                `Ingrese el dni del ${optionText.toUpperCase()}`;
            
            // Actualizar el placeholder según la opción
            const dniInput = document.getElementById('dniInput');
            dniInput.placeholder = optionText === 'Vehículo' ? 'Patente del vehículo' : 'Número de DNI';
        });
    });

    // Manejo del botón de búsqueda
    const searchButton = document.getElementById('searchButton');
    searchButton.addEventListener('click', buscarEnBaseDeDatos);

    // También permitir búsqueda con Enter
    document.getElementById('dniInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') buscarEnBaseDeDatos();
    });

    // Cargar datos iniciales (ejemplo: lista de alumnos)
    await cargarDatosIniciales();
});

// Función para buscar en la base de datos
async function buscarEnBaseDeDatos() {
    const dni = document.getElementById('dniInput').value.trim();
    const tipoBusqueda = document.querySelector('.option.active').textContent.trim();
    
    if (!dni) {
        mostrarMensaje('Por favor ingrese un valor para buscar', 'error');
        return;
    }

    try {
        let resultados;
        if (tipoBusqueda === 'Alumno') {
            resultados = await window.electronAPI.buscarAlumnoPorDNI(dni);
        } else if (tipoBusqueda === 'Particular') {
            resultados = await window.electronAPI.buscarParticularPorDNI(dni);
        } else if (tipoBusqueda === 'Vehículo') {
            resultados = await window.electronAPI.buscarVehiculoPorPatente(dni);
        }

        if (resultados && resultados.length > 0) {
            mostrarResultados(resultados, tipoBusqueda);
        } else {
            mostrarMensaje(`No se encontraron ${tipoBusqueda.toLowerCase()}s con ese dato`, 'info');
        }
    } catch (error) {
        console.error('Error en búsqueda:', error);
        mostrarMensaje('Error al realizar la búsqueda', 'error');
    }
}

// Función para mostrar resultados
function mostrarResultados(data, tipo) {
    const resultadosContainer = document.getElementById('resultadosContainer') || crearContenedorResultados();
    resultadosContainer.innerHTML = '';

    if (tipo === 'Alumno') {
        // Tabla para alumnos
        const tabla = document.createElement('table');
        tabla.className = 'resultados-table';
        
        // Cabeceras
        const thead = document.createElement('thead');
        thead.innerHTML = `
            <tr>
                <th>DNI</th>
                <th>Nombre</th>
                <th>Carrera</th>
                <th>Estado</th>
            </tr>
        `;
        
        // Cuerpo
        const tbody = document.createElement('tbody');
        data.forEach(alumno => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${alumno.dni}</td>
                <td>${alumno.nombre} ${alumno.apellido}</td>
                <td>${alumno.carrera}</td>
                <td>${alumno.estado}</td>
            `;
            tbody.appendChild(tr);
        });
        
        tabla.appendChild(thead);
        tabla.appendChild(tbody);
        resultadosContainer.appendChild(tabla);
    } else if (tipo === 'Vehículo') {
        // Mostrar datos de vehículo
        const vehiculo = data[0];
        const div = document.createElement('div');
        div.className = 'vehiculo-info';
        div.innerHTML = `
            <h4>Información del vehículo</h4>
            <p><strong>Patente:</strong> ${vehiculo.patente}</p>
            <p><strong>Marca:</strong> ${vehiculo.marca}</p>
            <p><strong>Modelo:</strong> ${vehiculo.modelo}</p>
            <p><strong>Dueño:</strong> ${vehiculo.propietario}</p>
        `;
        resultadosContainer.appendChild(div);
    }
}

// Función auxiliar para crear contenedor de resultados
function crearContenedorResultados() {
    const container = document.createElement('div');
    container.id = 'resultadosContainer';
    container.className = 'resultados-container';
    document.querySelector('.search-section').appendChild(container);
    return container;
}

// Función para mostrar mensajes al usuario
function mostrarMensaje(mensaje, tipo) {
    const mensajeDiv = document.createElement('div');
    mensajeDiv.className = `mensaje ${tipo}`;
    mensajeDiv.textContent = mensaje;
    
    const searchSection = document.querySelector('.search-section');
    const existingMsg = searchSection.querySelector('.mensaje');
    if (existingMsg) searchSection.removeChild(existingMsg);
    
    searchSection.appendChild(mensajeDiv);
    setTimeout(() => mensajeDiv.remove(), 3000);
}

// Función para cargar datos iniciales
async function cargarDatosIniciales() {
    try {
        const alumnos = await window.electronAPI.obtenerAlumnos();
        console.log('Datos iniciales cargados:', alumnos);
        // Aquí podrías hacer algo con los datos iniciales si lo necesitas
    } catch (error) {
        console.error('Error cargando datos iniciales:', error);
    }
}

// Función para cargar contenido según pestaña seleccionada
function cargarContenidoPestana(pestana) {
    console.log(`Cargando contenido para pestaña: ${pestana}`);
    // Implementar lógica para cambiar contenido según la pestaña
}