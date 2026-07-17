-- -
Esta es, sin duda, una de las formas más rápidas y directas de conseguir un RCE en una auditoría. Si una web te permite subir una foto de perfil, un currículum o un documento, y no valida correctamente lo que subes, la web está sentenciada.
# 1. El Escenario Ideal (Sin validación)

Un desarrollador despistado crea un formulario de subida de fotos de perfil. Guarda los archivos en una carpeta pública llamada `/uploads/` y no comprueba la extensión del archivo.

1. Creas un archivo en tu máquina llamado `shell.php` con el siguiente código:

![[Captura de pantalla 2026-06-26 130431.png]]

2. Lo subes a la web a través del formulario.
3. Navegas a la ruta pública: `http://vulnerable.com/uploads/shell.php?cmd=whoami`
4. El servidor ejecuta tu código PHP y tienes control total.
# 2. Evasión de Restricciones (Bypasses en el Mundo Real)

Hoy en día los desarrolladores ponen filtros. Como auditor, debes saber cómo romperlos:
### Bypass A: Filtros basados en Extensión (Listas Negras)

El desarrollador bloquea la extensión `.php`.

- **Solución:** Los servidores web suelen aceptar extensiones alternativas que también ejecutan código PHP. Puedes intentar subir: `.php3`, `.php4`, `.php5`, `.phtml`, `.phar` o `.phtm`. (Si el servidor es Windows/ASPX, puedes probar `.cer`, `.asa`, `.asax`).
### Bypass B: Modificación del Content-Type

El backend comprueba la cabecera `Content-Type` de la petición HTTP para asegurarse de que es una imagen.

- **Solución:** Interceptas la subida con **Burp Suite**. Verás que dice `Content-Type: application/x-php`. Lo borras y lo cambias manualmente por `Content-Type: image/jpeg`. Si el filtro solo miraba esa cabecera, el archivo pasará.
### Bypass C: Validación de Magic Bytes (Firma del archivo)

El servidor lee los primeros bytes del archivo para verificar que realmente es una imagen (una imagen GIF real siempre empieza por los caracteres `GIF89a`).

- **Solución:** Creas un archivo híbrido. Abres Burp Suite y en el cuerpo de tu archivo escribes:
![[Pasted image 20260626131007.png]]
	El servidor leerá los _Magic Bytes_, pensará que es un GIF legítimo, lo guardará como `foto.php` y, cuando lo ejecutes, PHP ignorará los caracteres `GIF89a` y ejecutará tu código malicioso.
# 3. Mitigación de Abuso de Subidas de Archivos

- **Cambiar el nombre del archivo:** Nunca guardar el archivo con el nombre original del usuario; generar un hash aleatorio (ej. `a8f3c9e2.jpg`).
- **Quitar permisos de ejecución:** Configurar la carpeta de subidas (`/uploads/`) en el servidor web (Apache/Nginx) para que tenga estrictamente prohibido ejecutar scripts (quitar permisos de ejecución de scripts, forzar que todo se sirva como texto plano o descargas).
- **Lista Blanca Estricta:** Validar las extensiones permitidas usando una lista blanca (solo `.jpg`, `.png`), nunca listas negras.
-- -
