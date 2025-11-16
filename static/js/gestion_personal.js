// static/js/gestionPersonal.js (CORREGIDO Y FINAL)

document.addEventListener('DOMContentLoaded', (event) => {
    // Estas variables 'const' fueron definidas en el HTML
    // const canDeletePersonal = ...
    // const canUpdatePersonal = ...

    cargarPersonal();
});

async function cargarPersonal() {
    const response = await fetch('/api/personal/list');
    const personal = await response.json();
    const tbody = document.querySelector('#personal-tabla tbody');
    tbody.innerHTML = ''; // Limpiar tabla

    personal.forEach(item => {
        const row = tbody.insertRow();
        
        // Mapeo correcto de datos a las <th> del HTML (6 columnas)
        row.insertCell(0).textContent = item.id; // ID
        row.insertCell(1).textContent = item.legajo; // Legajo
        row.insertCell(2).textContent = item.nombre; // Nombre
        row.insertCell(3).textContent = item.apellido; // Apellido
        row.insertCell(4).textContent = item.jerarquia; // Jerarquía
        
        const actionsCell = row.insertCell(5); // Celda de Acciones

        // Botón Modificar (aparece si el usuario tiene permiso)
        if (canUpdatePersonal) {
            const updateBtn = document.createElement('button');
            updateBtn.textContent = 'Modificar';
            // Función para cargar datos en el formulario de edición
            updateBtn.onclick = () => loadForEdit(item); 
            actionsCell.appendChild(updateBtn);
        }

        // Botón Eliminar (aparece si el usuario tiene permiso)
        if (canDeletePersonal) {
            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = 'Eliminar';
            deleteBtn.onclick = () => eliminarPersonal(item.id);
            actionsCell.appendChild(deleteBtn);
        }
    });
}

// Renombramos la función a 'addPersonal' para que coincida con el HTML
async function addPersonal() {
    // Usamos los IDs correctos del HTML
    const legajo = document.getElementById('new_legajo').value;
    const nombre = document.getElementById('new_nombre').value;
    const apellido = document.getElementById('new_apellido').value;
    const jerarquia = document.getElementById('new_jerarquia').value;

    if (!legajo || !nombre || !apellido || !jerarquia) {
        alert("Complete todos los campos.");
        return;
    }

    const response = await fetch('/api/personal/add', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ legajo, nombre, apellido, jerarquia }),
    });
    const data = await response.json();

    if (data.status === 'ok') {
        alert(data.mensaje);
        cargarPersonal(); // Recargar la tabla
        // Limpiar formulario
        document.getElementById('new_legajo').value = '';
        document.getElementById('new_nombre').value = '';
        document.getElementById('new_apellido').value = '';
        document.getElementById('new_jerarquia').value = '';
    } else {
        alert(`Error: ${data.mensaje}`);
    }
}

async function eliminarPersonal(personalId) {
    if (!confirm("¿Está seguro de eliminar este registro de personal?")) {
        return;
    }
    const response = await fetch(`/api/personal/delete/${personalId}`, {
        method: 'DELETE',
    });
    const data = await response.json();

    if (data.status === 'ok') {
        alert(data.mensaje);
        cargarPersonal(); // Recargar la tabla
    } else {
        // El backend ya debería dar un 403 Forbidden si no tiene permisos
        alert(`Error: ${data.mensaje}`); 
    }
}

// Función para cargar datos en el formulario de edición al hacer clic en 'Modificar'
function loadForEdit(item) {
    document.getElementById('edit_id').value = item.id;
    document.getElementById('edit_legajo').value = item.legajo;
    document.getElementById('edit_nombre').value = item.nombre;
    document.getElementById('edit_apellido').value = item.apellido;
    document.getElementById('edit_jerarquia').value = item.jerarquia;
}

// Función para enviar los datos de actualización
async function updatePersonal() {
    const id = document.getElementById('edit_id').value;
    const legajo = document.getElementById('edit_legajo').value;
    const nombre = document.getElementById('edit_nombre').value;
    const apellido = document.getElementById('edit_apellido').value;
    const jerarquia = document.getElementById('edit_jerarquia').value;

    if (!id || !legajo || !nombre || !apellido || !jerarquia) {
        alert("Complete todos los campos de edición.");
        return;
    }

    const response = await fetch(`/api/personal/update/${id}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ legajo, nombre, apellido, jerarquia }),
    });
    const data = await response.json();

    if (data.status === 'ok') {
        alert(data.mensaje);
        cargarPersonal(); // Recargar la tabla
        // Limpiar formulario de edición si es necesario
    } else {
        alert(`Error: ${data.mensaje}`);
    }
}
