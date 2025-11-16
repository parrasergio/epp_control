# C:\Users\Sergio Parra\Desktop\ControlEPP_Web\app\db.py (COMPLETO Y FINAL con permisos)

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base 

DATABASE_URL = "sqlite:///./epp_control.db"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base() 

def get_db():
    """Genera una sesión DB por solicitud web."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    from app.models import Personal, EPP, Entrega, Usuario, Role, Permission, pwd_context 
    Base.metadata.create_all(bind=engine)

    session = SessionLocal()
    try:
        # --- 1. Crear Permisos ---
        perms_to_create = [
            "manage_personal_add", "manage_personal_list", "manage_personal_update", "manage_personal_delete",
            "manage_epp_add", "manage_epp_list", "manage_epp_update", "manage_epp_delete",
            "manage_users", "download_csv"
        ]
        created_perms = {}
        for perm_name in perms_to_create:
            perm = session.query(Permission).filter_by(name=perm_name).first()
            if not perm:
                perm = Permission(name=perm_name)
                session.add(perm)
            created_perms[perm_name] = perm
        
        # --- 2. Crear Roles y asignar permisos ---
        # Rol Administrador (tiene todos los permisos)
        admin_role = session.query(Role).filter_by(name="Administrador").first()
        if not admin_role:
            admin_role = Role(name="Administrador", description="Administrador completo del sistema")
            admin_role.permissions.extend(created_perms.values())
            session.add(admin_role)

        # Rol Operador (puede añadir/listar/modificar, pero no borrar)
        operator_role = session.query(Role).filter_by(name="Operador").first()
        if not operator_role:
            operator_role = Role(name="Operador", description="Usuario con permisos limitados de gestión")
            operator_role.permissions.append(created_perms["manage_personal_add"])
            operator_role.permissions.append(created_perms["manage_personal_list"])
            operator_role.permissions.append(created_perms["manage_personal_update"])
            operator_role.permissions.append(created_perms["manage_epp_add"])
            operator_role.permissions.append(created_perms["manage_epp_list"])
            operator_role.permissions.append(created_perms["manage_epp_update"])
            operator_role.permissions.append(created_perms["download_csv"])
            session.add(operator_role)

        # --- 3. Crear el usuario administrador inicial ---
        admin_user = session.query(Usuario).filter_by(username="BomberoVRoca").first()
        if not admin_user:
            hashed_password = pwd_context.hash("1234") 
            new_admin = Usuario(
                username="BomberoVRoca",
                password_hash=hashed_password,
                is_admin=True
            )
            new_admin.roles.append(admin_role)
            session.add(new_admin)
            print("Usuario administrador 'BomberoVRoca' y roles creados.")
        
        session.commit()

    except Exception as e:
        print(f"Error al intentar crear usuarios, roles o permisos: {e}")
        session.rollback()
    finally:
        session.close()

