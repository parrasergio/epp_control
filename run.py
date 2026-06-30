from flask import Flask, render_template, redirect, url_for, flash, request
from flask_login import LoginManager, UserMixin, login_user, logout_user, current_user, login_required
from app.db import init_db, SessionLocal, get_db
from app.models import Personal, EPP, Entrega, Usuario, pwd_context
import os

app = Flask(__name__)
app.config['SECRET_KEY'] = 'una_cadena_secreta_muy_compleja_y_larga' 

login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'main_bp.login' 

# Registro del Blueprint principal
from app.routes import main_bp
app.register_blueprint(main_bp, url_prefix='/')

# Inicialización automática de la base de datos si no existe
if not os.path.exists('epp_control.db'):
    print("Base de datos no encontrada, inicializando...")
    init_db()

# Configuración de Flask-Login para la carga de usuarios
@login_manager.user_loader
def load_user(user_id):
    try:
        db_generator = get_db()
        session = next(db_generator)
        user = session.query(Usuario).get(int(user_id))
        return user
    except Exception:
        try:
            db_generator.close()
        except UnboundLocalError:
            pass
        return None

# Ejecución del servidor en modo de desarrollo local
if __name__ == "__main__":
    app.run(debug=True)
