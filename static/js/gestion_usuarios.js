// static/js/gestion_usuarios.js

/**
 * Envía una solicitud para crear un nuevo usuario.
 */
function addUser() {
    const username = document.getElementById('new_username').value;
    const password = document.getElementById('new_password').value;

    if (!username || !password) {
        alert("Por favor, complete ambos campos.");
        return;
    }

    fetch('/api/usuario/add', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: username, password: password }),
    })
    .then(response => response.json())
    .then(data => {
        alert(data.mensaje);
        if (data.status === 'ok') {
            // Recarga la página para ver el nuevo usuario en la tabla
            location.reload(); 
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Ocurrió un error al intentar añadir el usuario.');
    });
}

/**
 * Envía una solicitud para cambiar la contraseña de un usuario existente.
 */
function changePassword() {
    const userId = document.getElementById('edit_user_id').value;
    const newPassword = document.getElementById('edit_password').value;

    if (!userId || !newPassword) {
        alert("Por favor, complete el ID y la nueva contraseña.");
        return;
    }

    fetch(`/api/usuario/change_password/${userId}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ new_password: newPassword }),
    })
    .then(response => response.json())
    .then(data => {
        alert(data.mensaje);
        if (data.status === 'ok') {
            // Limpia los campos después de un cambio exitoso
            document.getElementById('edit_user_id').value = '';
            document.getElementById('edit_password').value = '';
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Ocurrió un error al intentar modificar la contraseña.');
    });
}
