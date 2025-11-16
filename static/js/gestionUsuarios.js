// static/js/gestionUsuarios.js (Código Completo y Corregido)

document.addEventListener('DOMContentLoaded', (event) => {
    // Carga inicial de la tabla y del desplegable al cargar la página
    loadUsersTable();
});

// Carga los usuarios en la tabla y en el desplegable (select)
function loadUsersTable() {
    fetch('/api/usuario/list')
        .then(response => response.json())
        .then(usuarios => {
            const tablaBody = document.querySelector('#usuarios-tabla tbody');
            const selectEditUserId = document.querySelector('#edit_user_id');
            
            // Limpiar listas anteriores
            tablaBody.innerHTML = '';
            selectEditUserId.innerHTML = '<option value="">Selecciona usuario</option>';

            usuarios.forEach(usuario => {
                // Llenar la tabla CON BOTONES DE ACCIÓN
                const fila = document.createElement('tr');
                fila.innerHTML = `
                    <td>${usuario.username}</td>
                    <td>
                        <!-- Botón de modificar/cambiar contraseña (redirecciona al panel de la izquierda) -->
                        <button onclick="seleccionarUsuarioParaCambio(${usuario.id}, '${usuario.username}')">Modificar Contraseña</button>
                        <!-- Botón de eliminar (usa la ruta en Python ahora) -->
                        <button onclick="deleteUser(${usuario.id}, '${usuario.username}')">Eliminar</button>
                    </td>
                `;
                tablaBody.appendChild(fila);

                // Llenar el desplegable (select) para cambiar contraseña
                const option = document.createElement('option');
                option.value = usuario.id;
                option.textContent = usuario.username;
                selectEditUserId.appendChild(option);
            });
        });
}

// Función para seleccionar un usuario de la tabla y pasarlo al formulario de la izquierda
function seleccionarUsuarioParaCambio(userId, username) {
    document.querySelector('#edit_user_id').value = userId;
    // Opcional: enfocar el campo de contraseña para que escriba directamente
    document.querySelector('#edit_password').focus(); 
}


// Función llamada desde el botón "Crear Usuario" en el HTML
function addUser() {
    const usernameInput = document.querySelector('#new_username');
    const passwordInput = document.querySelector('#new_password');
    // Captura el estado de la casilla de verificación (True o False)
    const isAdminCheckbox = document.querySelector('#new_is_admin'); 

    const username = usernameInput.value;
    const password = passwordInput.value;
    // Obtiene el valor booleano (True si está marcado, False si no)
    const is_admin = isAdminCheckbox.checked; 

    if (!username || !password) {
        alert("Por favor, completa ambos campos para el nuevo usuario.");
        return;
    }

    fetch('/api/usuario/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            username: username, 
            password: password,
            is_admin: is_admin // ¡Ahora enviamos si es admin o no!
        })
    })
    .then(response => response.json())
    .then(data => {
        alert(data.mensaje);
        if (data.status === 'ok') {
            // Limpiar inputs y recargar la lista
            usernameInput.value = '';
            passwordInput.value = '';
            isAdminCheckbox.checked = false; // Limpia también el checkbox después de crear
            loadUsersTable();
        }
    });
}

// Función llamada desde el botón "Modificar Contraseña" en el HTML
function changePassword() {
    const userIdSelect = document.querySelector('#edit_user_id');
    const passwordInput = document.querySelector('#edit_password');
    const userId = userIdSelect.value;
    const newPassword = passwordInput.value;

    if (!userId || !newPassword) {
        alert("Por favor, selecciona un usuario e introduce una nueva contraseña.");
        return;
    }

    // Nota: Esta ruta `/api/usuario/change-password/` TAMBIÉN necesita ser añadida en app/routes.py 
    // si quieres que funcione completamente. 

    fetch(`/api/usuario/change-password/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ new_password: newPassword })
    })
    .then(response => response.json())
    .then(data => {
        alert(data.mensaje);
        if (data.status === 'ok') {
            passwordInput.value = '';
            loadUsersTable();
        }
    });
}


// Función para eliminar usuario (USA LA RUTA EN PYTHON AHORA)
function deleteUser(userId, username) {
    if (!confirm(`¿Estás seguro de que deseas eliminar al usuario ${username}?`)) {
        return;
    }

    // Esta es la llamada real al backend:
    fetch(`/api/usuario/delete/${userId}`, {
        method: 'DELETE',
    })
    .then(response => response.json())
    .then(data => {
        alert(data.mensaje);
        if (data.status === 'ok') {
            loadUsersTable();
        }
    });
}
