// Variable global para almacenar el ID del bombero seleccionado en gestión
let currentBomberoGestionId = null;

async function buscarHistorialGestion() {
    const legajo = document.getElementById('legajo-gestion').value;
    if (!legajo) {
        alert("Ingrese un número de legajo.");
        return;
    }

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
    const response = await fetch(`/api/historial-bombero/${personal_id}`);
    const historial = await response.json();
    const tbody = document.querySelector('#tabla-gestion-entregas tbody');
    tbody.innerHTML = ''; 

    if (historial.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 15px;">No hay entregas registradas para este bombero.</td></tr>`;
        return;
    }

    historial.forEach(item => {
        const row = tbody.insertRow();
        row.insertCell(0).textContent = item.fecha;
        row.insertCell(1).textContent = item.epp_nombre;
        
        // CAMBIO LOCAL: Buscamos la marca en el localStorage basándonos en el código o nombre del EPP
        // Buscamos dinámicamente en el almacenamiento del navegador las claves que guardamos antes
        let marcaEncontrada = 'Sin especificar';
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith('marca_')) {
                // Si guardamos la marca ligada al código, intentamos emparejar de forma inteligente
                const cod = key.replace('marca_', '');
                // Compara si la marca guardada corresponde a este item de manera local
                if (localStorage.getItem(`nombre_${cod}`) === item.epp_nombre || item.epp_nombre.includes(cod)) {
                    marcaEncontrada = localStorage.getItem(key);
                    break;
                }
            }
        }
        
        // Si no se vinculó por nombre complejo, intentamos una búsqueda directa por coincidencia de texto
        if (marcaEncontrada === 'Sin especificar') {
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key.startsWith('marca_')) {
                    const marcaGuardada = localStorage.getItem(key);
                    // Comprobamos si el nombre del artículo guardado localmente coincide con la fila de la entrega
                    if (document.getElementById('codigo') === null) {
                        // Búsqueda de respaldo directo
                        const backupMarca = localStorage.getItem(`marca_${item.epp_nombre}`);
                        if(backupMarca) marcaEncontrada = backupMarca;
                    }
                }
            }
        }

        row.insertCell(2).textContent = marcaEncontrada; // Insertar marca en la columna 2
        row.insertCell(3).textContent = item.cantidad;
        row.insertCell(4).textContent = item.motivo;
        row.insertCell(5).textContent = item.aprobado_por;
        
        const celdaAccion = row.insertCell(6); // Se desplaza al índice 6 por la nueva columna
        celdaAccion.style.textAlign = 'center';
        
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

    const response = await fetch(`/api/eliminar-entrega/${entregaId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
    });
    const data = await response.json();

    if (data.status === 'ok') {
        alert(data.mensaje);
        if (currentBomberoGestionId) {
            cargarHistorialParaGestion(currentBomberoGestionId);
        }
    } else {
        alert(`Error: ${data.mensaje}`);
    }
}
