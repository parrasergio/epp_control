from passlib.context import CryptContext

# Asegúrate de que este contexto coincida con cómo está configurado en tu app/models.py
# Lo más probable es que use 'bcrypt'
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Define una contraseña simple y temporal
temp_password = "password123" 

# Genera el hash
hashed_password = pwd_context.hash(temp_password)
print(f"La contraseña temporal '{temp_password}' tiene el hash: {hashed_password}")
