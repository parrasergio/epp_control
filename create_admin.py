# create_admin.py (Actualizado con nombre de usuario BomberoRoca y todos los permisos)
from app.db import SessionLocal
from app.models import Usuario, pwd_context 

session = SessionLocal()

# Contraseña para el usuario administrador (¡MUY DÉBIL, CAMBIALA!)
password = "1234" 
hashed_password = pwd_context.hash(password) 

new_admin = Usuario(
    username='BomberoRoca', # Nombre de usuario cambiado
    password_hash=hashed_password,
    is_admin=True, # Es administrador completo
    # Habilitamos explícitamente los nuevos permisos granulares para este usuario:
    can_add_personal=True, 
    can_add_epp=True
)

session.add(new_admin)
session.commit()
session.close()

print(f"Usuario 'BomberoRoca' creado con todos los permisos.")
