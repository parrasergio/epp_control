# app/routes.py (VERSION FINAL CORREGIDA - Errores tipográficos resueltos)

from flask import render_template, request, jsonify, redirect, url_for, Blueprint, send_file, flash, abort, Response
from flask_login import login_required, current_user, logout_user, login_user
from app.db import SessionLocal
# Importamos check_password_hash y generate_password_hash para gestionar contraseñas en las rutas API de usuario
from werkzeug.security import check_password_hash, generate_password_hash
from app.models import Personal, EPP, Entrega, Usuario, Role, Permission 
from sqlalchemy import desc
import csv
import io
from functools import wraps 

# --- DEFINICIÓN DE DECORADORES DE PERMISOS RBAC ---

def permission_required(permission_name):
    """Requiere que el usuario tenga un permiso específico."""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            # El método has_permission en models.py ya revisa si es admin
            if not current_user.is_authenticated or not current_user.has_permission(permission_name):
                abort(403) 
            return f(*args, **kwargs)
        return decorated_function
    return decorator

# --- FIN DEFINICIÓN DE DECORADORES ---

# Creamos un Blueprint llamado 'main_bp'
main_bp = Blueprint('main_bp', __name__)

# --- Rutas de visualización (GET requests) ---

@main_bp.route('/')
@login_required 
def home():
    return render_template('home.html')

@main_bp.route('/entregas')
@login_required 
def entregas_epp():
    return render_template('entregas_epp.html')

@main_bp.route('/gestion-personal')
@login_required
@permission_required('manage_personal_list')
def gestion_personal():
    can_delete = current_user.has_permission('manage_personal_delete')
    can_update = current_user.has_permission('manage_personal_update')
    return render_template(
        'gestion_personal.html',
        can_manage_personal_delete=can_delete,
        can_manage_personal_update=can_update
    )

@main_bp.route('/gestion-epp')
@login_required
@permission_required('manage_epp_list')
def gestion_epp():
    return render_template('gestion_epp.html')

@main_bp.route('/gestion-usuarios')
@login_required
@permission_required('manage_users')
def gestion_usuarios():
    return render_template('gestion_usuarios.html')

# --- Rutas de Autenticación (Login/Logout) y Perfil ---

@main_bp.route('/login', methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated:
        return redirect(url_for('main_bp.home'))
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        session = SessionLocal()
        user = session.query(Usuario).filter_by(username=username).first()
        session.close()
        if user and user.check_password(password):
            login_user(user)
            next_page = request.args.get('next')
            return redirect(next_page or url_for('main_bp.home'))
        else:
            flash('Usuario o contraseña inválidos.', 'error')
            return redirect(url_for('main_bp.login'))
    return render_template('login.html')

@main_bp.route('/logout')
@login_required
def logout():
    logout_user()
    flash('Has cerrado sesión exitosamente.', 'success')
    return redirect(url_for('main_bp.login'))

@main_bp.route('/perfil')
@login_required
def user_profile():
    # Solución al error de perfil
    return render_template('user_profile.html', user=current_user)

# --- RUTA PARA EDITAR EPP ---
@main_bp.route('/gestion-epp/editar/<int:epp_id>', methods=['GET', 'POST'])
@login_required
@permission_required('manage_epp_update') 
def editar_epp(epp_id):
    session = SessionLocal()
    try:
        epp = session.query(EPP).get(epp_id)
        if not epp:
            abort(404)

        if request.method == 'POST':
            epp.codigo = request.form['codigo']
            epp.nombre = request.form['nombre']
            epp.stock = int(request.form['stock'])
            
            session.commit()
            flash('EPP actualizado exitosamente.', 'success')
            return redirect(url_for('main_bp.gestion_epp')) 

        return render_template('editar_epp.html', epp=epp)
    except Exception as e:
        session.rollback()
        flash(f'Error: {str(e)}', 'danger')
        return redirect(url_for('main_bp.gestion_epp'))
    finally:
        session.close()
# --- FIN RUTA EDITAR EPP ---


# --- Rutas de API para interactuar con la BD y Gestión de Datos (Personal/EPP) ---

@main_bp.route('/api/buscar-bombero/<legajo>', methods=['GET'])
@login_required
def api_buscar_bombero(legajo):
    session = SessionLocal()
    try:
        bombero = session.query(Personal).filter_by(legajo=legajo).first()
        if bombero:
            return jsonify({'encontrado': True, 'nombre': bombero.nombre, 'apellido': bombero.apellido, 'jerarquia': bombero.jerarquia, 'id': bombero.id})
        else:
            return jsonify({'encontrado': False, 'mensaje': f'No existe bombero con legajo {legajo}'})
    finally:
        session.close()

@main_bp.route('/api/buscar-epp/<codigo>', methods=['GET'])
@login_required
def api_buscar_epp(codigo):
    session = SessionLocal()
    try:
        epp_item = session.query(EPP).filter_by(codigo=codigo).first()
        if epp_item:
            return jsonify({'encontrado': True, 'nombre': epp_item.nombre, 'stock': epp_item.stock, 'id': epp_item.id})
        else:
            return jsonify({'encontrado': False, 'mensaje': f'No existe EPP con código {codigo}'})
    finally:
        session.close()

@main_bp.route('/api/epp/add', methods=['POST'])
@login_required
@permission_required('manage_epp_add') 
def api_add_epp():
    data = request.json
    session = SessionLocal()
    try:
        codigo = data.get('codigo')
        if session.query(EPP).filter_by(codigo=codigo).first():
            return jsonify({'status': 'error', 'mensaje': f'El código {codigo} ya existe.'}), 400
        
        nuevo_epp = EPP(
            codigo=codigo,
            nombre=data.get('nombre'),
            stock=data.get('stock')
        )
        session.add(nuevo_epp)
        session.commit()
        return jsonify({'status': 'ok', 'mensaje': 'EPP añadido correctamente'})
    except Exception as e:
        session.rollback()
        return jsonify({'status': 'error', 'mensaje': str(e)}), 500
    finally:
        session.close()

@main_bp.route('/api/epp/list', methods=['GET'])
@login_required
@permission_required('manage_epp_list')
def api_list_epp():
    session = SessionLocal()
    try:
        epps = session.query(EPP).all()
        return jsonify([{
            'id': epp.id, 
            'codigo': epp.codigo, 
            'nombre': epp.nombre, 
            'stock': epp.stock
        } for epp in epps])
    finally:
        session.close()

@main_bp.route('/api/epp/delete/<int:epp_id>', methods=['DELETE'])
@login_required
@permission_required('manage_epp_delete')
def api_delete_epp(epp_id):
    session = SessionLocal()
    try:
        epp = session.query(EPP).get(epp_id)
        if not epp:
            return jsonify({'status': 'error', 'mensaje': 'EPP no encontrado'}), 404
        session.delete(epp)
        session.commit()
        return jsonify({'status': 'ok', 'mensaje': 'EPP eliminado correctamente'})
    except Exception as e:
        session.rollback()
        return jsonify({'status': 'error', 'mensaje': str(e)}), 500
    finally:
        session.close()

@main_bp.route('/api/stock_csv', methods=['GET'])
@login_required
@permission_required('manage_epp_list')
def api_stock_csv():
    session = SessionLocal()
    try:
        epps = session.query(EPP).all()
        si = io.StringIO()
        cw = csv.writer(si)
        cw.writerow(['ID', 'Codigo', 'Nombre', 'Stock'])
        for epp in epps:
            cw.writerow([epp.id, epp.codigo, epp.nombre, epp.stock])
        output = io.BytesIO(si.getvalue().encode('utf-8'))
        return send_file(output,
                         mimetype='text/csv',
                         download_name='listado_stock_epp.csv',
                         as_attachment=True)
    finally:
        session.close()


@main_bp.route('/api/realizar-entrega', methods=['POST'])
@login_required
@permission_required('manage_personal_add')
def api_realizar_entrega():
    data = request.json
    session = SessionLocal()
    try:
        personal_id = data.get('personal_id')
        epp_id = data.get('epp_id')
        cantidad = data.get('cantidad')
        motivo = data.get('motivo')
        aprobado_por = data.get('aprobado_por')
        p = session.query(Personal).get(personal_id)
        e = session.query(EPP).get(epp_id)
        if not p or not e:
            return jsonify({'status': 'error', 'mensaje': 'Personal o EPP no encontrados'}), 404
        if e.stock < cantidad:
            return jsonify({'status': 'error', 'mensaje': 'Stock insuficiente'}), 400
        nueva_entrega = Entrega(personal=p, epp=e, cantidad=cantidad, motivo=motivo, aprobado_por=aprobado_por)
        e.stock -= cantidad
        session.add(nueva_entrega)
        session.commit()
        return jsonify({'status': 'ok', 'mensaje': 'Entrega registrada correctamente', 'nuevo_stock': e.stock})
    except Exception as e:
        session.rollback()
        return jsonify({'status': 'error', 'mensaje': str(e)}), 500
    finally:
        session.close()

@main_bp.route('/api/personal/add', methods=['POST'])
@login_required
@permission_required('manage_personal_add')
def api_add_personal():
    data = request.json
    session = SessionLocal()
    try:
        legajo = data.get('legajo')
        if session.query(Personal).filter_by(legajo=legajo).first():
            return jsonify({'status': 'error', 'mensaje': f'El legajo {legajo} ya existe.'}), 400
        nuevo_personal = Personal(legajo=legajo, nombre=data.get('nombre'), apellido=data.get('apellido'), jerarquia=data.get('jerarquia'))
        session.add(nuevo_personal)
        session.commit()
        return jsonify({'status': 'ok', 'mensaje': 'Personal añadido correctamente'})
    except Exception as e:
        session.rollback()
        return jsonify({'status': 'error', 'mensaje': str(e)}), 500
    finally:
        session.close()

@main_bp.route('/api/personal/list', methods=['GET'])
@login_required
@permission_required('manage_personal_list')
def api_list_personal():
    session = SessionLocal()
    try:
        personal_list = session.query(Personal).all()
        return jsonify([{
            'id': p.id,
            'legajo': p.legajo,
            'nombre': p.nombre,
            'apellido': p.apellido,
            'jerarquia': p.jerarquia
        } for p in personal_list])
    finally:
        session.close()

@main_bp.route('/api/personal/delete/<int:personal_id>', methods=['DELETE'])
@login_required
@permission_required('manage_personal_delete')
def api_delete_personal(personal_id):
    session = SessionLocal()
    try:
        personal = session.query(Personal).get(personal_id)
        if not personal:
            return jsonify({'status': 'error', 'mensaje': 'Registro de personal no encontrado'}), 404
        
        session.delete(personal)
        session.commit()
        return jsonify({'status': 'ok', 'mensaje': 'Registro de personal eliminado correctamente'})
    except Exception as e:
        session.rollback()
        return jsonify({'status': 'error', 'mensaje': str(e)}), 500
    finally:
        session.close()

@main_bp.route('/api/personal/update/<int:personal_id>', methods=['POST'])
@login_required
@permission_required('manage_personal_update')
def api_update_personal(personal_id):
    data = request.json
    session = SessionLocal()
    try:
        personal = session.query(Personal).get(personal_id)
        if not personal:
            return jsonify({'status': 'error', 'mensaje': 'Registro de personal no encontrado'}), 404
        
        personal.legajo = data.get('legajo', personal.legajo)
        personal.nombre = data.get('nombre', personal.nombre)
        personal.apellido = data.get('apellido', personal.apellido)
        personal.jerarquia = data.get('jerarquia', personal.jerarquia)
        
        session.commit()
        return jsonify({'status': 'ok', 'mensaje': 'Registro de personal actualizado correctamente'})
    except Exception as e:
        session.rollback()
        return jsonify({'status': 'error', 'mensaje': str(e)}), 500
    finally:
        session.close()

# --- RUTAS API GESTION DE USUARIOS (Corregido 'login_bp' a 'main_bp') ---

@main_bp.route('/api/usuario/list', methods=['GET'])
@login_required
@permission_required('manage_users')
def api_list_users():
    session = SessionLocal()
    try:
        users = session.query(Usuario).all()
        return jsonify([{
            'id': user.id,
            'username': user.username,
            'is_admin': user.is_admin
        } for user in users])
    finally:
        session.close()

@main_bp.route('/api/usuario/add', methods=['POST'])
@login_required
@permission_required('manage_users')
def api_add_user():
    data = request.json
    session = SessionLocal()
    try:
        username = data.get('username')
        password = data.get('password')
        is_admin = data.get('is_admin', False)
        
        if session.query(Usuario).filter_by(username=username).first():
            return jsonify({'status': 'error', 'mensaje': f'El usuario {username} ya existe.'}), 400
        
        hashed_password = generate_password_hash(password)

        nuevo_usuario = Usuario(
            username=username,
            password_hash=hashed_password,
            is_admin=is_admin
        )
        session.add(nuevo_usuario)
        session.commit()
        return jsonify({'status': 'ok', 'mensaje': 'Usuario añadido correctamente'})
    except Exception as e:
        session.rollback()
        return jsonify({'status': 'error', 'mensaje': str(e)}), 500
    finally:
        session.close()

@main_bp.route('/api/usuario/change-password/<int:user_id>', methods=['POST'])
@login_required
@permission_required('manage_users')
def api_change_password(user_id):
    data = request.json
    session = SessionLocal()
    try:
        user = session.query(Usuario).get(user_id)
        if not user:
            return jsonify({'status': 'error', 'mensaje': 'Usuario no encontrado'}), 404
        
        new_password = data.get('new_password')
        if not new_password:
             return jsonify({'status': 'error', 'mensaje': 'Contraseña inválida'}), 400

        user.password_hash = generate_password_hash(new_password)
        session.commit()
        return jsonify({'status': 'ok', 'mensaje': 'Contraseña actualizada correctamente'})
    except Exception as e:
        session.rollback()
        return jsonify({'status': 'error', 'mensaje': str(e)}), 500
    finally:
        session.close()

@main_bp.route('/api/usuario/delete/<int:user_id>', methods=['DELETE'])
@login_required
@permission_required('manage_users')
def api_delete_user(user_id):
    session = SessionLocal()
    try:
        # Importante: Prevenir que un admin se elimine a sí mismo
        if current_user.id == user_id:
            return jsonify({'status': 'error', 'mensaje': 'No puedes eliminar tu propia cuenta.'}), 400

        user = session.query(Usuario).get(user_id)
        if not user:
            return jsonify({'status': 'error', 'mensaje': 'Usuario no encontrado'}), 404
        
        session.delete(user)
        session.commit()
        return jsonify({'status': 'ok', 'mensaje': 'Usuario eliminado correctamente'})
    except Exception as e:
        session.rollback()
        return jsonify({'status': 'error', 'mensaje': str(e)}), 500
    finally:
        session.close()
