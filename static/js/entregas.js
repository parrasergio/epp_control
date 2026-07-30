// Variable global para almacenar el ID del bombero actual y el EPP actual
let currentBomberoId = null;
let currentEppId = null;
let currentEppStock = 0;

// --- Funciones de Utilidad ---

function limpiarTablaHistorial() {
    const tbody = document.querySelector('#historial-tabla tbody');
    tbody.innerHTML = '';
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
        cargarHistorial(data.id); 
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
    const response = await fetch(`/api/buscar-epp?codigo=${encodeURIComponent(codigo)}`);
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
        headers: { 'Content-Type': 'application/json' },
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
        document.getElementById('stock-lbl').textContent = data.nuevo_stock;
        currentEppStock = data.nuevo_stock;
        cargarHistorial(currentBomberoId);
        limpiarCamposEPP(); 
        document.getElementById('aprobado-por').value = '';
    } else {
        alert(`Error: ${data.mensaje}`);
    }
}

async function cargarHistorial(personal_id) {
    const response = await fetch(`/api/historial-bombero/${personal_id}`);
    const historial = await response.json();
    const tbody = document.querySelector('#historial-tabla tbody');
    tbody.innerHTML = ''; 

    historial.forEach(item => {
        const row = tbody.insertRow();
        row.insertCell(0).textContent = item.fecha;
        row.insertCell(1).textContent = item.epp_nombre;
        // CAMBIO NATIVO: Insertamos la marca en la columna 2 leyendo lo que envía Flask desde la BD
        row.insertCell(2).textContent = item.marca || 'Sin especificar';
        row.insertCell(3).textContent = item.cantidad;
        row.insertCell(4).textContent = item.motivo;
        row.insertCell(5).textContent = item.aprobado_por;
    });
}

// CAMBIO NATIVO: Genera el CSV con la columna Marca y autojustifica las celdas para Excel
function imprimirHistorialCSV() {
    let tabla = document.getElementById("historial-tabla");
    let filas = tabla.querySelectorAll("tbody tr");
    
    if (filas.length === 0) {
        alert("No hay datos en el historial para exportar.");
        return;
    }

    // TRUCO PROFESIONAL: "sep=;" le avisa a Excel que autoajuste y separe las columnas de forma nativa al abrirlo
    let contenidoCSV = "sep=;\nFecha;EPP;Marca;Cantidad;Motivo;Aprobado por\n";

    filas.forEach(f => {
        let columnas = f.querySelectorAll("td");
        if(columnas.length > 0) {
            let filaTexto = Array.from(columnas).map(c => `"${c.innerText.replace(/"/g, '""')}"`).join(";");
            contenidoCSV += filaTexto + "\n";
        }
    });

    // Usamos Blob con codificación UTF-8 con BOM para que Excel reconozca epp con tildes y caracteres especiales sin romperse
    let blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), contenidoCSV], { type: "text/csv;charset=utf-8;" });
    let link = document.createElement("a");
    let url = URL.createObjectURL(blob);
    
    link.setAttribute("href", url);
    link.setAttribute("download", "historial_entregas.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
