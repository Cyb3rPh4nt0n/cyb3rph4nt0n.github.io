-- -
Este es un vector de evasión y suplantación lógico sumamente ingenioso que ocurre cuando la base de datos y el backend de la aplicación procesan y limitan los tamaños de las cadenas de texto de forma discordante.
-- -
# 1. El Principio del Truncado

En muchas bases de datos (como MySQL o MariaDB configuradas en modos no estrictos), si una columna (por ejemplo, `username`) está definida con un límite fijo de caracteres, como `VARCHAR(20)`, e intentas insertar una cadena de 30 caracteres, la base de datos no arrojará un error; simplemente **cortará (truncará) el texto a los primeros 20 caracteres y descartará el resto**, guardando la cadena recortada en el disco.

Además, por estándar SQL, los espacios en blanco al final de una cadena se ignoran durante ciertas comparaciones de selección (`'admin ' = 'admin'`).
# 2. El Escenario de Explotación

Imagina que la aplicación web cuenta con un usuario administrador legítimo cuyo nombre de usuario es **`admin`**. Tú quieres suplantarlo creando una cuenta nueva a través del formulario de registro público. Si intentas registrarte como `admin`, el sistema te dirá: _"El usuario ya existe"_.
### El Payload del Auditor:

Creas una cadena que empiece por la palabra `admin`, seguida de muchos espacios en blanco y terminada en un carácter cualquiera, calculando que la palabra y los espacios llenen exactamente el límite del `VARCHAR(20)` de la base de datos:

```
Posición: 12345678901234567890 21
Cadena:   admin                x
          [--- 20 caracteres ---]
```
### ¿Qué ocurre en el servidor?

1. **Validación del Backend:** El código de la aplicación web hace una consulta: `SELECT * FROM usuarios WHERE username = 'admin               x'`. Como esa cadena exacta no existe en la base de datos, el backend da el visto bueno y dice: _"Nombre disponible, procedo a registrarlo"_.
2. **Inserción en la Base de Datos:** El backend ejecuta el comando `INSERT INTO usuarios ... VALUES ('admin               x')`.
3. **El Truncado:** Al intentar guardar la cadena en una columna de longitud máxima de 20, la base de datos corta el carácter `x`. En el disco duro se guarda únicamente: `'admin               '`.
4. **La Suplantación:** Cuando intentas iniciar sesión con tu contraseña utilizando el usuario `admin`, si la consulta de login busca coincidencias ignorando los espacios finales, el sistema podría hacer un match con tu registro truncado o confundir los registros, permitiéndote evadir los paneles de control u otorgándote acceso como si fueses el administrador legítimo.
# 3. Mitigación de Ataque de Truncado SQL

Asegurar que la base de datos corra en modo estricto (`STRICT_ALL_TABLES` en MySQL) para que rechace cualquier petición que intente exceder el tamaño máximo de una columna con un error `Data too long`, en lugar de truncarla silenciosamente. Asimismo, validar la longitud máxima del input en el backend antes de enviarlo a la base de datos.
-- -
