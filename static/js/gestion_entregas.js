// Variable global para almacenar el ID del bombero seleccionado en gestión
let currentBomberoGestionId = null;

async function buscarHistorialGestion() {
    const legajo = document.getElementById('legajo-gestion').value;
    if (!legajo) {
        alert("Ingrese un número de legajo.");
        return;
    }

    // Buscamos al bombero usando tu API nativa existente
    const response = await fetch(`/api/buscar-bombero/${legajo}`);
    const data = await response.json();

    if (data.encontrado) {
        document.getElementById('bombero-nombre-gestion').textContent = `${data.nombre} ${data.apellido} (${data.jerarquia})`;
        currentBomberoGestionId = data.id;
        cargarHistorialParaGestion(data.id); 
    } else {
        alert(data.mensaje);
        document.getElementById('bombero-nombre-gestion').textContent = "Ninguno";
        currentBomberoGestionId = null;
        document.querySelector('#tabla-gestion-entregas tbody').innerHTML = '';
    }
}

async function cargarHistorialParaGestion(personal_id) {
    // Usamos la ruta del historial que creamos hoy en Python
    const response = await fetch(`/api/historial-bombero/${personal_id}`);
    const historial = await response.json();
    const tbody = document.querySelector('#tabla-gestion-entregas tbody');
    tbody.innerHTML = ''; 

    if (historial.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 15px;">No hay entregas registradas para este bombero.</td></tr>`;
        return;
    }

    historial.forEach(item => {
        const row = tbody.insertRow();
        row.insertCell(0).textContent = item.fecha;
        row.insertCell(1).textContent = item.epp_nombre;
        row.insertCell(2).textContent = item.cantidad;
        row.insertCell(3).textContent = item.motivo;
        row.insertCell(4).textContent = item.aprobado_por;
        
        // Creamos la celda de acción con el botón de Eliminar Carga
        const celdaAccion = row.insertCell(5);
        celdaAccion.style.textAlign = 'center';
        
        // CORRECCIÓN DIRECTA: Forzamos a que lea primero el 'id' que viene de la base de datos
        const idCorrecto = item.id || item.entrega_id;
        celdaAccion.innerHTML = `<button onclick="eliminarEntregaRegistro(${idCorrecto})" style="background-color: #dc3545; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-weight: bold;">❌ Borrar Carga</button>`;
    });
}

async function eliminarEntregaRegistro(entregaId) {
    if (!entregaId) {
        alert("Error: No se pudo identificar el ID de esta entrega.");
        return;
    }

    if (!confirm("¿Está seguro de que desea eliminar esta entrega errónea? El stock se devolverá automáticamente.")) {
        return;
    }

    // Llamamos a la API de borrado que creamos en el Paso 1 en Python
    const response = await fetch(`/api/eliminar-entrega/${entregaId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
    });
    const data = await response.json();

    if (data.status === 'ok') {
        alert(data.mensaje);
        // Recargamos la tabla para mostrar los cambios actualizados
        if (currentBomberoGestionId) {
            cargarHistorialParaGestion(currentBomberoGestionId);
        }
    } else {
        alert(`Error: ${data.mensaje}`);
    }
}
