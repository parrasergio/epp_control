// static/js/gestionPersonal.js

document.addEventListener('DOMContentLoaded', (event) => {
    cargarPersonal();
});

async function cargarPersonal() {
    const response = await fetch('/api/personal/list');
    const personal = await response.json();
    const tbody = document.querySelector('#personal-tabla tbody');
    tbody.innerHTML = ''; // Limpiar tabla

    personal.forEach(item => {
        const row = tbody.insertRow();
        row.insertCell(0).textContent = item.legajo;
        row.insertCell(1).textContent = item.nombre;
        row.insertCell(2).textContent = item.apellido;
        row.insertCell(3).textContent = item.jerarquia;
        
        const deleteCell = row.insertCell(4);
        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'Eliminar';
        deleteBtn.onclick = () => eliminarPersonal(item.id);
        deleteCell.appendChild(deleteBtn);
    });
}

async function añadirPersonal() {
    const legajo = document.getElementById('legajo').value;
    const nombre = document.getElementById('nombre').value;
    const apellido = document.getElementById('apellido').value;
    const jerarquia = document.getElementById('jerarquia').value;

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
        document.getElementById('legajo').value = '';
        document.getElementById('nombre').value = '';
        document.getElementById('apellido').value = '';
        document.getElementById('jerarquia').value = '';
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
        alert(`Error: ${data.mensaje}`);
    }
}
