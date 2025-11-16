# C:\Users\Sergio Parra\Desktop\ControlEPP_Web\app\models.py (COMPLETO Y FINAL con permisos)

from sqlalchemy import Boolean, Column, Integer, String, ForeignKey, DateTime, Table
from sqlalchemy.orm import relationship, backref
from sqlalchemy.sql import func
from app.db import Base
from flask_login import UserMixin 
from passlib.context import CryptContext 

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# --- Tabla de asociación para la relación muchos-a-muchos entre Usuario y Role ---
user_roles = Table('user_roles', Base.metadata,
    Column('user_id', Integer, ForeignKey('usuarios.id'), primary_key=True),
    Column('role_id', Integer, ForeignKey('roles.id'), primary_key=True)
)
# --- Tabla de asociación para la relación muchos-a-muchos entre Role y Permiso ---
role_permissions = Table('role_permissions', Base.metadata,
    Column('role_id', Integer, ForeignKey('roles.id'), primary_key=True),
    Column('permission_id', Integer, ForeignKey('permissions.id'), primary_key=True)
)
# --------------------------------------------------------------------------------------

class Permission(Base):
    __tablename__ = 'permissions'
    id = Column(Integer(), primary_key=True)
    name = Column(String(50), unique=True)

    def __repr__(self):
        return f"<Permission '{self.name}'>"

class Personal(Base):
    __tablename__ = "personal"
    id = Column(Integer, primary_key=True, index=True)
    legajo = Column(Integer, unique=True, index=True)
    nombre = Column(String)
    apellido = Column(String)
    jerarquia = Column(String)
    entregas = relationship("Entrega", back_populates="personal")

class EPP(Base):
    __tablename__ = "epp"
    id = Column(Integer, primary_key=True, index=True)
    codigo = Column(String, unique=True, index=True)
    nombre = Column(String)
    stock = Column(Integer)
    entregas = relationship("Entrega", back_populates="epp")

class Entrega(Base):
    __tablename__ = "entregas"
    id = Column(Integer, primary_key=True, index=True)
    fecha = Column(DateTime, server_default=func.now())
    personal_id = Column(Integer, ForeignKey("personal.id"))
    epp_id = Column(Integer, ForeignKey("epp.id"))
    cantidad = Column(Integer)
    motivo = Column(String)
    aprobado_por = Column(String)
    personal = relationship("Personal", back_populates="entregas")
    epp = relationship("EPP", back_populates="entregas")

# --- Clase Role (Actualizada con permisos) ---
class Role(Base):
    __tablename__ = 'roles'
    id = Column(Integer(), primary_key=True)
    name = Column(String(50), unique=True)
    description = Column(String(255))
    permissions = relationship("Permission", secondary=role_permissions, backref="roles", lazy='joined')

    def __repr__(self):
        return f"<Role '{self.name}'>"
    
    def has_permission(self, permission_name):
        return any(permission.name == permission_name for permission in self.permissions)
# -------------------------

# --- Clase Usuario (Actualizada con método has_permission) ---
class Usuario(UserMixin, Base):
    __tablename__ = 'usuarios'
    id = Column(Integer, primary_key=True)
    username = Column(String(255), unique=True, index=True)
    password_hash = Column(String(255))
    is_admin = Column(Boolean, default=False)
    
    roles = relationship("Role", secondary=user_roles, backref="usuarios", lazy='joined')

    def set_password(self, password):
        self.password_hash = pwd_context.hash(password)

    def check_password(self, password):
        return pwd_context.verify(password, self.password_hash)
    
    def has_role(self, role_name):
        return any(role.name == role_name for role in self.roles)

    def has_permission(self, permission_name):
        if self.is_admin:
            return True
        return any(role.has_permission(permission_name) for role in self.roles)

    def get_id(self):
        return str(self.id)

    def __repr__(self):
        return f"<Usuario '{self.username}'>"

# -------------------------
