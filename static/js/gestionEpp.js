// static/js/gestionEpp.js (Modificado con persistencia local de Marca)

document.addEventListener('DOMContentLoaded', (event) => {
    cargarEpp();
});

function modificarEpp(eppId) {
    window.location.href = `/gestion-epp/editar/${eppId}`; 
}

async function cargarEpp() {
    const response = await fetch('/api/epp/list');
    const eppList = await response.json();
    const tbody = document.querySelector('#epp-tabla tbody');
    tbody.innerHTML = ''; 

    eppList.forEach(item => {
        const row = tbody.insertRow();
        row.insertCell(0).textContent = item.codigo;
        row.insertCell(1).textContent = item.nombre;
        
        // CAMBIO LOCAL: Recuperamos la marca desde el localStorage usando el código como clave
        const marcaLocal = localStorage.getItem(`marca_${item.codigo}`) || 'Sin especificar';
        row.insertCell(2).textContent = marcaLocal;
        
        row.insertCell(3).textContent = item.stock;
        
        const actionsCell = row.insertCell(4); // Desplazado al índice 4 por la nueva columna
        const modBtn = document.createElement('button');
        modBtn.textContent = 'Modificar';
        modBtn.onclick = () => modificarEpp(item.id); 
        actionsCell.appendChild(modBtn);
    });
}

async function añadirEpp() {
    const codigo = document.getElementById('codigo').value;
    const nombre = document.getElementById('nombre').value;
    const marca = document.getElementById('marca').value; // Capturamos la marca de la UI
    const stock = document.getElementById('stock').value;

    if (!codigo || !nombre || !marca || !stock) {
        alert("Complete todos los campos.");
        return;
    }

    const response = await fetch('/api/epp/add', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ codigo, nombre, stock: parseInt(stock) }), // La API recibe lo mismo (BD intacta)
    });
    const data = await response.json();

    if (data.status === 'ok') {
        // CAMBIO LOCAL: Si el servidor aceptó el registro, guardamos la marca en el localStorage
        localStorage.setItem(`marca_${codigo}`, marca);
        localStorage.setItem(`nombre_${codigo}`, nombre);


        alert(data.mensaje);
        cargarEpp(); 
        
        // Limpiar formulario completo
        document.getElementById('codigo').value = '';
        document.getElementById('nombre').value = '';
        document.getElementById('marca').value = '';
        document.getElementById('stock').value = '';
    } else {
        alert(`Error: ${data.mensaje}`);
    }
    }
