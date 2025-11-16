# setup_roles.py (ACTUALIZADO)

from app.db import SessionLocal
from app.models import Usuario, Role
import sys

def setup_roles_and_admin():
    session = SessionLocal()
    try:
        # 1. Crear roles si no existen
        admin_role = session.query(Role).filter_by(name='Administrador').first()
        if not admin_role:
            admin_role = Role(name='Administrador', description='Acceso completo al sistema.')
            session.add(admin_role)
            print("Rol 'Administrador' creado.")

        user_role = session.query(Role).filter_by(name='Usuario Regular').first()
        if not user_role:
            user_role = Role(name='Usuario Regular', description='Solo puede realizar entregas.')
            session.add(user_role)
            print("Rol 'Usuario Regular' creado.")
        
        session.commit() # Guardamos los roles primero

        # 2. Crear usuario administrador por defecto si no existe
        # CAMBIADO: Nuevo nombre de usuario
        USERNAME = 'BomberoRoca'
        PASSWORD = '1234' # CAMBIADO: Nueva contraseña

        admin_user = session.query(Usuario).filter_by(username=USERNAME).first()
        if not admin_user:
            admin_user = Usuario(username=USERNAME)
            admin_user.set_password(PASSWORD) 
            session.add(admin_user)
            print(f"Usuario '{USERNAME}' creado con contraseña '{PASSWORD}'. ¡Cámbiala en producción!")

        # 3. Asignar rol de administrador al usuario admin
        if admin_role not in admin_user.roles:
            admin_user.roles.append(admin_role)
            print(f"Rol 'Administrador' asignado a '{USERNAME}'.")
        
        session.commit()
        print("Configuración de roles y administrador completada exitosamente.")

    except Exception as e:
        session.rollback()
        print(f"Ocurrió un error durante la configuración inicial: {e}")
        sys.exit(1)
    finally:
        session.close()

if __name__ == '__main__':
    setup_roles_and_admin()
