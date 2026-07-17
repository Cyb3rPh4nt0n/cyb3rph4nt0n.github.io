-- -
# 1. ¿Qué es LaTeX y por qué se inyecta?

LaTeX es un sistema de composición de textos, muy utilizado para escribir fórmulas matemáticas complejas y generar PDFs científicos de alta calidad en el servidor.

Imagina una aplicación web donde pones una fórmula matemática y el backend la procesa con un binario de LaTeX (como `pdflatex`) para escupirte un PDF limpio.

Si la aplicación web no filtra los comandos nativos de LaTeX, el auditor puede inyectar directivas del compilador.
# 2. El Ataque: Lectura de archivos y RCE

LaTeX no es solo un formateador de texto; tiene comandos potentes para interactuar con el sistema de archivos del servidor donde se está ejecutando.
### Escenario de Explotación A: Lectura de archivos internos (LFI)

Si el auditor inyecta el comando `\input` o `\include`, puede forzar al compilador de LaTeX a meter el contenido de un archivo del servidor dentro del PDF generado.

- **Payload:** `\input{/etc/passwd}`
- **Resultado:** El PDF descargable contendrá todo el archivo de usuarios del servidor Linux en texto legible.
### Escenario de Explotación B: Ejecución Remota de Comandos (RCE)

Si el compilador de LaTeX tiene habilitada una directiva llamada `shell_escape` (muy común para permitir que paquetes externos de LaTeX corran scripts), podemos ejecutar comandos del sistema directamente usando la directiva `\write18`.

- **Payload:** `\immediate\write18{whoami > prueba.txt}\input{prueba.txt}`
- **Resultado:** El servidor ejecuta el comando `whoami`, guarda el resultado en `prueba.txt` y luego introduce ese texto dentro del documento final.
# 3. Mitigación de LaTeX

Deshabilitar por completo la directiva `--shell-escape` en el binario de compilación (`pdflatex`), correr el proceso en un entorno aislado (Chroot jail, contenedor Docker seguro) y denegar el acceso a comandos peligrosos como `\input`, `\include`, `\openin` y `\read`.
-- -
