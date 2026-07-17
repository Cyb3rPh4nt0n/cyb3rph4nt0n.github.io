-- -
# 1. ¿Qué es y por qué ocurre?

El ataque de **Asignación Masiva** (también conocido como _Parameter Binding Vulnerability_ o _Auto-binding_) ocurre cuando los frameworks de desarrollo modernos (como Ruby on Rails, Spring Boot, Laravel o ASP.NET) permiten enlazar automáticamente los parámetros que envía un usuario en una petición HTTP (como un JSON o un formulario POST) directamente con las propiedades de un objeto o un modelo de la base de datos en el backend, **sin filtrar qué campos tiene permitido modificar el usuario**.

Para ahorrar líneas de código al desarrollador, estos frameworks permiten tomar todos los parámetros enviados por el usuario en una petición HTTP (como un JSON de un formulario) y guardarlos o enlazarlos directamente en un objeto o registro de la base de datos con una sola función (ej: `User.create(params)` o `$user->update($request->all())`).

El fallo de lógica ocurre si el programador no define una lista estricta de qué campos _tiene permitido_ modificar el usuario común.
# 2. El Escenario de Explotación

Imagina que estás auditando el formulario de actualización de datos de perfil de un usuario. Cuando cambias tu biografía y tu teléfono, la aplicación web envía la siguiente petición:

```HTTP
POST /api/users/register HTTP/1.1
Content-Type: application/json

{
	"username": "auditor_test",
	"email": "test@audit.local",
	"password": "Password123!"
}
```

Como auditor, debes intuir cómo está modelada la tabla de usuarios en la base de datos e intentar realizar un "Fuzzing de parámetros lógicos". Pruebas a inyectar variables de control interno que intuyes que maneja el backend:

```JSON
{
	"username": "auditor_test",
	"email": "test@audit.local",
	"password": "Password123!",
	"is_admin": true,
	"role": "administrator",
	"balance": 999999
}
```

Si el backend procesa el JSON de manera masiva e indiscriminada, el framework mapeará automáticamente la propiedad `"is_admin": true` al campo correspondiente en la base de datos. Al finalizar la petición, habrás creado una cuenta con privilegios de administrador globales.
# 3. Mass Assignment Attack

Utilizar características de protección nativas del framework, como las propiedades `fillable` o `guarded` en Laravel, o implementar patrones de transferencia de datos puros (**DTO - Data Transfer Objects**) para mapear a mano únicamente los campos permitidos.
-- -
