-- -
# 1. ¿Cómo funciona la persistencia de datos en la Web?

Cuando inicias sesión en una plataforma, buscas un producto en una tienda online o filtras por categorías, la aplicación web (escrita en PHP, Python, JS, etc.) no almacena esa información en memoria; se la pide a un sistema gestor de bases de datos (como MySQL, PostgreSQL, Oracle o SQL Server) utilizando el lenguaje **SQL (Structured Query Language)**.
### Escenario normal:

Imagina un buscador de productos en una tienda online. Cuando buscas "portátil", el código del servidor genera una consulta dinámicamente como esta:

```SQL
SELECT * FROM productos WHERE nombre_producto = 'portátil';
```

El motor de la base de datos procesa la consulta y le devuelve al servidor web la lista de portátiles. El servidor web los maqueta en HTML y tú los ves en tu pantalla.
# 2. ¿Qué es SQL Injection (SQLi) y cómo funciona por dentro?

Una inyección SQL ocurre cuando **los datos introducidos por el usuario se concatenan directamente en la consulta SQL** sin ser filtrados, sanitizados o parametrizados. Esto permite al atacante "romper" el contexto de los datos y saltar al contexto de los comandos, alterando por completo la lógica de la consulta original.
### El Código Vulnerable (Backend en PHP/MySQL):

Mira este fragmento de código. Aquí es donde ocurre el pecado del desarrollador:

```PHP
$id_usuario = $_GET['id']; // El usuario controla esta variable a través de la URL (?id=1)
$query = "SELECT username, email FROM usuarios WHERE id = " . $id_usuario;
$result = mysqli_query($conn, $query);
```
### El Ataque (Manipulando la lógica):

Si el usuario legítimo introduce `1`, la consulta es: `SELECT ... WHERE id = 1` (Todo bien).

Pero, ¿qué pasa si el auditor introduce como payload `1 OR 1=1`? La consulta final que ejecuta la base de datos se convierte en:

```SQL
SELECT username, email FROM usuarios WHERE id = 1 OR 1=1;
```

**Análisis técnico:** Como la condición `1=1` siempre es verdadera (True), la cláusula `WHERE` se anula de forma lógica. La base de datos no solo devolverá el usuario con ID 1, sino **absolutamente todos los registros de la tabla usuarios**, exponiendo información confidencial.
# 3. Tipos de SQL Injection

No todas las inyecciones SQL se comportan igual ni devuelven los datos directamente en la pantalla. Como auditor, te enfrentarás a tres tipos principales:
### A. In-Band SQLi (Classic SQLi)

Es la más fácil de explotar. El atacante utiliza el mismo canal de comunicación para lanzar el ataque y ver los resultados directamente en la página web. Tiene dos sub-tipos:

- **Error-Based SQLi (Basada en errores):** Forzamos a la base de datos a generar un error sintáctico (por ejemplo, introduciendo una comilla simple `'`). Si la web muestra el error interno de la base de datos en pantalla (ej: _"You have an error in your SQL syntax; check the manual..."_), podemos usar ese mismo error para que nos dumpee información del sistema.
- **Union-Based SQLi (Basada en unión):** Utilizamos el operador SQL `UNION` para fusionar los resultados de la consulta original con una consulta propia de nuestra elección. Nos permite extraer tablas enteras directamente en el HTML de la página.
### B. Inferential SQLi (Blind / Ciega SQLi)

Aquí la aplicación web **no muestra datos ni errores SQL en pantalla**. Está "ciega". Sin embargo, podemos _inferir_ si la consulta es vulnerable haciendo preguntas de tipo SI/NO a la base de datos.

- **Boolean-Based (Basada en booleanos):** Enviamos una condición verdadera (`AND 1=1`) y una falsa (`AND 1=2`). Si la web cambia sutilmente (por ejemplo, desaparece un botón o un texto cuando es falso), sabemos que la base de datos está respondiendo a nuestras condiciones. Podemos adivinar datos letra por letra (ej: "¿La primera letra de la contraseña empieza por A?").
- **Time-Based (Basada en tiempo):** Si la web no cambia en absoluto visualmente, inyectamos funciones que ralentizan el servidor (como `SLEEP(5)` en MySQL o `pg_sleep(5)` en PostgreSQL). Si la página tarda exactamente 5 segundos más en cargar, confirmamos que la inyección es exitosa.
### C. Out-of-Band SQLi (OOB)

Se utiliza cuando no podemos ver los resultados en la web ni el tiempo es fiable. Forzamos a la base de datos a realizar una conexión de red saliente (DNS o HTTP) hacia un servidor controlado por nosotros (por ejemplo, usando _Burp Collaborator_), incluyendo los datos extraídos en la petición.
# 4. Metodología de Detección y Explotación Manual

Vamos a ver cómo actuaría un auditor en un escenario real usando **Union-Based SQLi** (el método clásico).
### Paso 1: Detectar el punto de inyección

Navegando con Burp Suite, encuentras una URL: `http://vulnerable.com/articulo.php?id=3`.
Añades una comilla simple al parámetro: `?id=3'`. La página web se rompe o da un error 500. Hay indicios de SQLi.
### Paso 2: Determinar el número de columnas

Para usar un `UNION`, nuestra consulta debe tener **el mismo número exacto de columnas** que la consulta original. Usamos la cláusula `ORDER BY`:

- `?id=3 ORDER BY 1-- -` (Carga bien)
- `?id=3 ORDER BY 2-- -` (Carga bien)
- `?id=3 ORDER BY 3-- -` (Carga bien)
- `?id=3 ORDER BY 4-- -` (Error: _Unknown column '4' in 'order clause'_)
- **Conclusión:** La consulta original selecciona exactamente **3 columnas**. _(Nota: El `-- -` es el comentario en SQL para ignorar el resto de la consulta original que venga después)._
### Paso 3: Encontrar columnas vulnerables y extraer datos

Ahora inyectamos el `UNION` usando valores nulos o números para ver cuál se refleja en pantalla:
`?id=-3 UNION SELECT 1, 2, 3-- -`
_(Nota: Ponemos el ID original en negativo `-3` para que la primera consulta no devuelva nada y la web se vea obligada a pintar los resultados de nuestro SELECT)._

Si en la pantalla de la web aparece mágicamente impreso el número `2`, significa que **la columna 2 es vulnerable** y lo que pongamos ahí se renderizará.
### Paso 4: Extracción de información (Ejemplo en MySQL)

Para extraer la versión de la base de datos y el usuario actual en la columna 2, cambiaríamos el payload a:
`?id=-3 UNION SELECT 1, version(), 3-- -` o `?id=-3 UNION SELECT 1, user(), 3-- -`

A partir de ahí, un auditor mapearía el diccionario de la base de datos (`information_schema` en MySQL) para listar las tablas, luego las columnas de la tabla que le interese (como `usuarios`), y finalmente extraer las contraseñas.
# 5. ¿Cómo se mitiga (Remediación)?

Como auditor, tu reporte debe incluir la solución. La única forma 100% segura de mitigar SQLi es mediante **Consultas Preparadas (Prepared Statements) o Parámetros Vinculados**.

Al usar consultas preparadas, la estructura de la consulta SQL se compila en el motor de la base de datos _antes_ de insertar los datos del usuario. La base de datos tratará el input estrictamente como un texto plano (un string), imposibilitando que altere la lógica del código SQL.
### Código Seguro (en PHP PDO):

```PHP
$stmt = $pdo->prepare('SELECT username, email FROM usuarios WHERE id = :id');
$stmt->execute(['id' => $id_usuario]); // El input pasa de forma segura como parámetro aislado
$user = $stmt->fetch();
```
-- -
