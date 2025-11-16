// Variable global para almacenar el ID del bombero actual y el EPP actual
let currentBomberoId = null;
let currentEppId = null;
let currentEppStock = 0;

// --- Funciones de Utilidad ---

function limpiarTablaHistorial() {
    const tbody = document.querySelector('#historial-tabla tbody');
    tbody.innerHTML = '';
    document.querySelector('button[onclick="imprimirHistorialCSV()"]').disabled = true;
}

function limpiarCamposEPP() {
    document.getElementById('codigo-epp').value = '';
    document.getElementById('nombre-epp-lbl').textContent = '';
    document.getElementById('stock-lbl').textContent = '';
    document.getElementById('cantidad').value = 1;
    document.getElementById('motivo').value = '';
    document.getElementById('aprobado-por').value = '';
    currentEppId = null;
    currentEppStock = 0;
}

// --- Funciones para interactuar con el Backend (API Flask) ---

async function buscarBombero() {
    const legajo = document.getElementById('legajo').value;
    if (!legajo) {
        alert("Ingrese un número de legajo.");
        return;
    }
    const response = await fetch(`/api/buscar-bombero/${legajo}`);
    const data = await response.json();

    if (data.encontrado) {
        document.getElementById('nombre-lbl').textContent = data.nombre;
        document.getElementById('apellido-lbl').textContent = data.apellido;
        document.getElementById('jerarquia-lbl').textContent = data.jerarquia;
        currentBomberoId = data.id;
        cargarHistorial(data.id); // Cargar historial automáticamente al encontrar
    } else {
        alert(data.mensaje);
        limpiarCampos();
    }
}

function limpiarCampos() {
    document.getElementById('legajo').value = '';
    document.getElementById('nombre-lbl').textContent = '';
    document.getElementById('apellido-lbl').textContent = '';
    document.getElementById('jerarquia-lbl').textContent = '';
    currentBomberoId = null;
    limpiarTablaHistorial();
    limpiarCamposEPP();
}

async function buscarEPP() {
    const codigo = document.getElementById('codigo-epp').value;
    if (!codigo) {
        alert("Ingrese código EPP");
        return;
    }
    const response = await fetch(`/api/buscar-epp/${codigo}`);
    const data = await response.json();

    if (data.encontrado) {
        document.getElementById('nombre-epp-lbl').textContent = data.nombre;
        document.getElementById('stock-lbl').textContent = data.stock;
        currentEppId = data.id;
        currentEppStock = data.stock;
    } else {
        alert(data.mensaje);
        limpiarCamposEPP();
    }
}

async function realizarEntrega() {
    if (!currentBomberoId) {
        alert("Primero debe buscar y seleccionar un bombero.");
        return;
    }
    if (!currentEppId) {
        alert("Primero debe buscar y seleccionar un EPP.");
        return;
    }
    
    const cantidad = parseInt(document.getElementById('cantidad').value);
    const motivo = document.getElementById('motivo').value;
    const aprobado_por = document.getElementById('aprobado-por').value;

    if (!aprobado_por) {
        alert("Debe indicar quién aprueba la entrega.");
        return;
    }

    if (cantidad > currentEppStock) {
        alert("Stock insuficiente.");
        return;
    }

    const response = await fetch('/api/realizar-entrega', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            personal_id: currentBomberoId,
            epp_id: currentEppId,
            cantidad: cantidad,
            motivo: motivo,
            aprobado_por: aprobado_por
        }),
    });
    const data = await response.json();

    if (data.status === 'ok') {
        alert(data.mensaje);
        // Actualizar stock en la UI
        document.getElementById('stock-lbl').textContent = data.nuevo_stock;
        currentEppStock = data.nuevo_stock;
        // Recargar el historial para reflejar la nueva entrega
        cargarHistorial(currentBomberoId);
        // Limpiar campos de entrega excepto el bombero actual
        limpiarCamposEPP(); 
        document.getElementById('aprobado-por').value = ''; // Mantener este campo limpio para la próxima entrega
    } else {
        alert(`Error: ${data.mensaje}`);
    }
}

async function cargarHistorial(personal_id) {
    const response = await fetch(`/api/historial-bombero/${personal_id}`);
    const historial = await response.json();
    const tbody = document.querySelector('#historial-tabla tbody');
    tbody.innerHTML = ''; // Limpiar tabla antes de cargar datos nuevos

    historial.forEach(item => {
        const row = tbody.insertRow();
        row.insertCell(0).textContent = item.fecha;
        row.insertCell(1).textContent = item.epp_nombre;
        row.insertCell(2).textContent = item.cantidad;
        row.insertCell(3).textContent = item.motivo;
        row.insertCell(4).textContent = item.aprobado_por;
    });

    document.querySelector('button[onclick="imprimirHistorialCSV()"]').disabled = historial.length === 0;
}

function imprimirHistorialCSV() {
    if (currentBomberoId) {
        // Al hacer clic en el botón, el navegador descarga el archivo de la API
        window.location.href = `/api/historial-csv/${currentBomberoId}`;
    }
}

