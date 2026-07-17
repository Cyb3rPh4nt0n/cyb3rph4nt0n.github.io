-- -
# 1. ¿Cómo funciona una consulta en MongoDB?

En lugar de `SELECT`, MongoDB utiliza funciones y objetos de búsqueda. Por ejemplo, un login en una API de Node.js con MongoDB se ve así:

```JavaScript
// El backend recibe el JSON del cliente
// { "user": "admin", "pass": "secret" }
db.usuarios.find({ username: req.body.user, password: req.body.pass });
```
# 2. El Ataque: Inyección NoSQL (Manipulación de Objetos)

En las inyecciones NoSQL, en lugar de introducir caracteres como la comilla (`'`) para romper texto, **inyectamos operadores lógicos en formato JSON**.

Los operadores más comunes en MongoDB son:

- `$gt` (Greater Than / Mayor que)
- `$ne` (Not Equal / No igual a)

Si interceptamos la petición de login con **Burp Suite** y cambiamos el tipo de datos de un simple texto a un objeto JSON, podemos alterar la consulta.
### Petición modificada en Burp Suite:

```JSON
{
	"user": "admin",
	"pass": { "$ne": "password_cualquiera" }
}
```
### ¿Qué pasa en el servidor?

El backend mete ese objeto directamente en la consulta de MongoDB:

```JavaScript
db.usuarios.find({ username: "admin", password: { "$ne": "password_cualquiera" } });
```

**Análisis técnico:** Le estamos diciendo a la base de datos: _"Búscame el usuario 'admin' cuya contraseña **NO SEA IGUAL** a 'password_cualquiera'"_. Como la contraseña real obviamente no es "password_cualquiera", la condición se evalúa como **Verdadera (True)** y el servidor nos autentica como administradores sin saber la contraseña.
# 3. Mitigación en NoSQL

Para evitar esto, el desarrollador nunca debe pasar el objeto `req.body` directamente a la base de datos. Debe asegurarse de que los valores recibidos sean estrictamente cadenas de texto (Strings) y no sub-objetos, o utilizar un ODM (como _Mongoose_) que sanitice los tipos de datos automáticamente.
-- -
