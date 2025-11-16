// static/js/gestionEpp.js (Funcional)

document.addEventListener('DOMContentLoaded', (event) => {
    cargarEpp();
});

// --- FUNCIÓN MODIFICAR AHORA REDIRIGE A LA PÁGINA DE EDICIÓN ---
function modificarEpp(eppId) {
    // Redirige al usuario a la URL de edición que maneja routes.py
    window.location.href = `/gestion-epp/editar/${eppId}`; 
}

async function cargarEpp() {
    // URL Corregida: /api/epp/list
    const response = await fetch('/api/epp/list');
    const eppList = await response.json();
    const tbody = document.querySelector('#epp-tabla tbody');
    tbody.innerHTML = ''; // Limpiar tabla

    eppList.forEach(item => {
        const row = tbody.insertRow();
        row.insertCell(0).textContent = item.codigo;
        row.insertCell(1).textContent = item.nombre;
        row.insertCell(2).textContent = item.stock;
        
        // --- CAMBIO AQUÍ: Botón Modificar ---
        const actionsCell = row.insertCell(3);
        const modBtn = document.createElement('button');
        modBtn.textContent = 'Modificar';
        // Solo pasamos el ID a la función
        modBtn.onclick = () => modificarEpp(item.id); 
        actionsCell.appendChild(modBtn);
    });
}

async function añadirEpp() {
    const codigo = document.getElementById('codigo').value;
    const nombre = document.getElementById('nombre').value;
    const stock = document.getElementById('stock').value;

    if (!codigo || !nombre || !stock) {
        alert("Complete todos los campos.");
        return;
    }

    // URL Corregida: /api/epp/add
    const response = await fetch('/api/epp/add', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ codigo, nombre, stock: parseInt(stock) }),
    });
    const data = await response.json();

    if (data.status === 'ok') {
        alert(data.mensaje);
        cargarEpp(); // Recargar la tabla
        // Limpiar formulario
        document.getElementById('codigo').value = '';
        document.getElementById('nombre').value = '';
        document.getElementById('stock').value = '';
    } else {
        alert(`Error: ${data.mensaje}`);
    }
}

// La función eliminarEpp comentada se mantiene por si la necesitas más adelante.
/*
async function eliminarEpp(eppId) {
    if (!confirm("¿Está seguro de eliminar este EPP?")) {
        return;
    }
    const response = await fetch(`/api/epp/delete/${eppId}`, {
        method: 'DELETE',
    });
    const data = await response.json();

    if (data.status === 'ok') {
        alert(data.mensaje);
        cargarEpp();
    } else {
        alert(`Error: ${data.mensaje}`);
    }
}
*/
