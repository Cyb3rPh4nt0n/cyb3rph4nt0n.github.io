-- -
# 1. ¿Qué es un motor de plantillas?

Los desarrolladores no escriben código HTML estático para cada página. Utilizan motores de plantillas (como **Twig** o **Smarty** en PHP, **Jinja2** o **Mako** en Python/Flask, y **Thymeleaf** en Java) para crear interfaces dinámicas.

Una plantilla normal tiene variables entre marcadores especiales. Por ejemplo, en Jinja2 (Python):

```HTML
<h1>Bienvenido, {{ nombre_usuario }}!</h1>
```

El servidor web toma ese archivo, busca `{{ nombre_usuario }}`, lo reemplaza por el nombre real de la base de datos y le envía el HTML final al cliente.
# 2. El Pecado: Inyección de Plantillas en el Servidor

El peligro ocurre cuando el desarrollador, en lugar de pasar el dato del usuario como una variable dentro de la plantilla, **permite que el usuario escriba directamente dentro de la estructura de la plantilla**.
### Código Vulnerable (Python / Flask / Jinja2):

```Python
from flask import Flask, request, render_template_string
app = Flask(__name__)

@app.route("/perfil")
def perfil():
	nombre = request.args.get('name') # El usuario controla este parámetro
	# El desarrollador concatena el input directamente en el string de la plantilla
	plantilla = f"<html><body><h1>Hola {nombre}</h1></body></html>"
	return render_template_string(plantilla)
```
# 3. Cómo Detectarlo (La fase de Fuzzing)

Si sospechas de un SSTI en un parámetro (por ejemplo, `?name=Juan`), le envías operaciones matemáticas básicas envueltas en la sintaxis de los motores de plantillas más comunes: `?name={{7*7}}` o `?name=${7*7}`

- Si la web te responde con: **"Hola Juan"**, no es vulnerable (trató tu input como texto).
- Si la web te responde con: **"Hola 49"**, el servidor **ha ejecutado la operación matemática dentro de su backend**. ¡Tienes un SSTI!
# 4. Cómo Explotarlo (De SSTI a RCE)

Como la plantilla se ejecuta directamente en el contexto del lenguaje de programación del servidor (Python, PHP, Java), podemos usar la sintaxis de ese lenguaje para importar librerías del sistema y ejecutar comandos.

Por ejemplo, en **Jinja2 (Python)**, un payload clásico para listar los archivos del servidor web (ejecutar `ls`) se aprovecha del acceso a los objetos base de Python (`__class__`, `__mro__`, `__subclasses__`) para llegar al módulo `os`:

```HTML
{{ self.__class__.__mro[2].__subclasses__()[407]('/etc/passwd').read() }}
```
_(Nota: El número del índice cambia según la versión de Python, pero el objetivo es el mismo: forzar al motor de plantillas a leer archivos del sistema o ejecutar comandos a través de `os.popen('comando').read()`)_.
# 5. Mitigación de SSTI

Nunca concatenar la entrada del usuario en el string de la plantilla. Pasar los datos estrictamente como variables de contexto (parámetros separados) que el motor de plantillas se encargará de renderizar de forma segura.
-- -
