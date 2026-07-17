-- -
# 1. ¿Por qué ocurre?

Ocurre cuando una aplicación web necesita ejecutar un comando directamente en la terminal del servidor (Linux o Windows) para hacer una tarea (como mandar un ping, redimensionar una imagen con un binario del sistema, o generar un PDF) y le pasa datos del usuario a esa función de la terminal.
# 2. El Código Vulnerable (PHP):

Imagina una herramienta web para administradores que comprueba si un servidor está online mediante `ping`:

```PHP
$ip = $_GET['id'];
// El desarrollador ejecuta un comando del sistema operativo (shell)
$output = shell_exec("ping -c 4 " . $ip);
echo "<pre>$output</pre>";
```
# 3. El Ataque: Operadores de la Shell

En las terminales de Linux y Windows, existen operadores que permiten encadenar múltiples comandos en una sola línea:

- `;` (Linux): Ejecuta el segundo comando después del primero.
- `&&` (Linux/Windows): Ejecuta el segundo comando solo si el primero tuvo éxito.
- `|` (Linux/Windows): Pasa la salida del primer comando como entrada al segundo (Pipe).
- `||` (Linux/Windows): Ejecuta el segundo comando solo si el primero falló.

Si el auditor introduce en el parámetro `ip` el payload: `8.8.8.8 ; whoami`
### ¿Qué ejecuta el servidor internamente?

```bash
ping -c 4 8.8.8.8 ; whoami
```

El servidor ejecutará el ping y, acto seguido, **ejecutará el comando `whoami`**, devolviendo el nombre del usuario del sistema (por ejemplo, `www-data` o `apache`) directamente en la respuesta HTTP. ¡Hemos comprometido el servidor!

> Notas para Bypass:
> 1. Uso del operador OR (`||`), obligamos que el primer comando falle y con el operador OR hacemos que la shell ejecute el comando inyectado.
> 2. Uso de `%0A`, si la blacklist está mal implementada el `%0A` (equivale a `\n` en formato URL-encode) se interpretará como un salto de línea, y se ejecutará el comando inyectado. 
# 4. Mitigación de Command Injection

- **Evitar funciones peligrosas:** Nunca usar `system()`, `exec()`, `shell_exec()` o `passthru()` pasándole variables directas.
- **Uso de APIs nativas:** Si quieres hacer un ping o mover un archivo, usa las funciones nativas del lenguaje de programación (ej. funciones de red de PHP o Node.js), nunca llames a la terminal del sistema operativo.
- **Sanitización estricta:** Si es estrictamente necesario usar la terminal, usar funciones de escape específicas como `escapeshellarg()` o `escapeshellcmd()` en PHP.
-- -
