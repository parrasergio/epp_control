from app.db import SessionLocal
from app.models import Usuario, pwd_context 

session = SessionLocal()

# Contraseña encriptada para el administrador
password = "1234" 
hashed_password = pwd_context.hash(password) 

# Creamos el usuario sin los campos de permisos que dan error
new_admin = Usuario(
    username='BomberoRoca',
    password_hash=hashed_password,
    is_admin=True
)

try:
    session.add(new_admin)
    session.commit()
    print("Usuario 'BomberoRoca' creado con éxito en la base de datos.")
except Exception as e:
    session.rollback()
    print(f"Error al crear el usuario: {e}")
finally:
    session.close()
