-- -
Ya vimos el concepto básico (transformar un string en un objeto vivo en memoria). Ahora vamos a profundizar en cómo este mecanismo se corrompe en lenguajes y formatos específicos para lograr un **RCE (Remote Code Execution)**. El peligro real no es solo cambiar una variable como `is_admin=true`, sino obligar al intérprete a ejecutar funciones del sistema operativo al reconstruir el objeto.
-- -
# 1. Ataques de Deserialización Avanzados
### A. Deserialización en Python: El Peligro de `pickle`

En Python, el módulo nativo para serializar y deserializar objetos es `pickle`. Es extremadamente potente, pero su propia documentación advierte que **nunca se debe deserializar un string que provenga de una fuente no confiable**.
#### ¿Por qué es vulnerable?

`pickle` permite definir un método mágico llamado `__reduce__()` dentro de una clase. Este método le dice a Python cómo debe reconstruir el objeto cuando se llame a `pickle.loads()`. Si el método `__reduce__()` devuelve una tupla que contiene una función ejecutable (como `os.system`) y sus argumentos, **Python ejecutará esa función de forma automática inmediatamente durante la deserialización**.
#### El Payload del Auditor:

```Python
import pickle
import os

class EvadirSeguridad(object):
	def __reduce__(self):
		# Al deserializarse, el servidor ejecutará este comando de terminal
		return (os.system, ('whoami',))

# Serializamos el objeto malicioso
payload_serializado = pickle.dumps(EvadirSeguridad())
print(payload_serializado) # Esto genera un string de bytes malicioso
```

Si la aplicación web recibe este string de bytes (por ejemplo, codificado en Base64 en una cookie) y hace un `pickle.loads(cookie_maliciosa)`, el servidor ejecutará el comando `whoami` en el sistema operativo bajo los privilegios del servidor web.
### B. Deserialización en YAML: El caso de PyYAML

YAML es un formato de serialización de datos legible por humanos, muy usado en archivos de configuración y APIs. En Python, la librería más famosa para procesarlo es `PyYAML`.
#### El Error de Configuración:

Históricamente, los desarrolladores llamaban a la función `yaml.load()` para procesar los datos. El problema es que `yaml.load()` por defecto permitía la instanciación de cualquier objeto de Python utilizando etiquetas especiales de tipo (`!!python/object/apply`).
#### El Payload del Auditor:

Si una API procesa un JSON o un archivo YAML enviado por ti, puedes inyectar directivas nativas del constructor de Python:

```YAML
!!python/object/apply:os.system ["id"]
```

Cuando el parser lee la etiqueta `!!python/object/apply`, invoca la función especificada (`os.system`) pasándole el argumento (`id`). Esto otorga un RCE inmediato.

- _Mitigación:_ Hoy en día es obligatorio usar `yaml.safe_load()`, el cual restringe el procesamiento estrictamente a tipos de datos planos (strings, enteros, listas) y bloquea la instanciación de objetos de código.
-- -
