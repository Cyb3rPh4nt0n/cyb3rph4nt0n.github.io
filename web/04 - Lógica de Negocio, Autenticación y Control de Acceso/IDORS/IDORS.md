-- -
# 1. ¿Qué es un IDOR (Insecure Direct Object Reference)?

Un **IDOR** (Referencia Directa Insegura a Objetos) ocurre cuando una aplicación web utiliza un identificador interno (como un número de ID, un nombre de usuario o un parámetro en la URL/API) para acceder a un recurso directamente, **pero el backend no valida si el usuario que hace la petición tiene realmente autorización para ver o modificar ese recurso específico**.
### El escenario del mundo real

Imagina que inicias sesión en una plataforma de facturación. Haces clic en "Ver mi última factura" y el navegador te lleva a la siguiente URL:

```HTTP
http://facturas.com/descargar.php?id_factura=5021
```

Como auditor, tus ojos deben irse inmediatamente a ese número `5021`. ¿Qué pasa si lo cambias en Burp Suite por `5020` o `5019`?

- **Escenario A (Aplicación Segura):** El servidor comprueba si la factura `5020` pertenece a tu cuenta corporativa. Como no es tuya, te responde con un `403 Forbidden` o `401 Unauthorized`.
- **Escenario B (Vulnerabilidad IDOR):** El desarrollador simplemente programó un `SELECT * FROM facturas WHERE id = $id_factura` en el código, olvidando cruzarlo con el ID de tu sesión actual. El servidor te devuelve la factura del otro cliente en texto legible. ¡Tienes un IDOR de lectura!
# 2. Control de Acceso Vertical vs. Horizontal

Los fallos de control de acceso se dividen en dos ejes principales según los privilegios del atacante y de la víctima.
### A. Control de Acceso Horizontal (IDOR Tradicional)

Ocurre cuando un atacante accede a recursos o datos que pertenecen a **otro usuario que tiene su mismo nivel de privilegios**.

- **Ejemplo:** El usuario _A_ (un cliente estándar) modifica un parámetro para ver o modificar la información del perfil del usuario _B_ (otro cliente estándar). El impacto suele ser la violación masiva de la privacidad de los usuarios.
### B. Control de Acceso Vertical (Privilege Escalation / Escalación de Privilegios)

Ocurre cuando un usuario con pocos privilegios (o un usuario no autenticado) logra acceder a funciones o recursos reservados para **usuarios con roles superiores** (como Moderadores, Administradores o Superusuarios).

- **Ejemplo:** Un cliente estándar descubre que si modifica la petición HTTP de `/user/dashboard` a `/admin/dashboard`, el panel de administración se le renderiza por completo sin pedirle credenciales de administrador.
# 3. Metodología de Detección Manual de IDORs

Para encontrar IDORs de forma profesional, debes mapear exhaustivamente cómo la aplicación identifica sus objetos.
### Pasos para el Auditor:

1. **Crear dos cuentas de prueba:** Siempre que audites una web con control de acceso, necesitas dos usuarios con los mismos privilegios (ej. `Auditor_A` y `Auditor_B`) y, si es posible, uno con privilegios elevados (`Admin`).
2. **Mapear los identificadores (Mapeo de Rutas):** Navega con la cuenta del `Auditor_A` y captura en el _HTTP History_ de Burp Suite todos los parámetros que parezcan IDs (pueden ser numéricos, hashes MD5, UUIDs o nombres).
3. **Intercambio de Tokens (La Prueba de Fuego):** Envía la petición crítica del `Auditor_A` (por ejemplo, `POST /api/v1/updateProfile` con el cuerpo `{"user_id": 9921, "email": "nuevo@correo.com"}`) al **Repeater** de Burp Suite. Cambia la cookie de sesión o el Token JWT del `Auditor_A` por el token de sesión del `Auditor_B`.
4. Analizar la respuesta:

	- Si la petición se procesa con éxito y el perfil del usuario `9921` se actualiza usando la sesión del otro usuario, el IDOR está confirmado.
### Tipos de identificadores y cómo abordarlos:

- **Numéricos/Secuenciales (`?id=101`):** Son los más fáciles. Se explotan haciendo _Fuzzing_ o un ataque de fuerza bruta con el **Intruder** de Burp Suite para descargar miles de registros de forma secuencial.
- **UUIDs / Hashes (`?id=a8f3c9e2...`):** Muchos desarrolladores usan identificadores únicos aleatorios para mitigar el IDOR secuencial. No obstante, si el backend sigue sin comprobar la autorización, **sigue siendo un IDOR**. El reto aquí es _encontrar_ el UUID de la víctima (a veces están expuestos de forma pública en comentarios de blogs, perfiles públicos o APIs de búsqueda).
# 4. Mitigación de IDORs

El IDOR nunca se soluciona ocultando los IDs o transformándolos en hashes complejos, ya que eso es solo "Seguridad por Oscuridad". La única solución real consiste en implementar un control de acceso centralizado a nivel de objeto.

1. **Validación de Autorización basada en Contexto:** Cada vez que el backend reciba una petición para consultar o modificar un objeto mediante un identificador, el código debe forzar una comprobación explícita cruzando el recurso solicitado con el identificador del usuario que está almacenado en la sesión segura del servidor.

```PHP
// CÓDIGO SEGURO
$id_factura = $_GET['id_factura'];
$id_usuario_sesion = $_SESSION['user_id']; // Variable segura que el usuario no controla

// Cruzamos el ID del recurso con la sesión del dueño legítimo
$stmt = $pdo->prepare('SELECT * FROM facturas WHERE id = :id_factura AND usuario_id = :id_usuario');
$stmt->execute(['id_factura' => $id_factura, 'id_usuario' => $id_usuario_sesion]);
```

2. **Uso de Identificadores Indirectos Indirect Reference Maps (Opcional):** En lugar de exponer el ID real de la base de datos, la aplicación genera mapas de referencias temporales por sesión (ej. en la interfaz del usuario la factura actual se llama `factura_1`, y el servidor sabe internamente en esa sesión específica a qué ID de la base de datos corresponde).
-- -
