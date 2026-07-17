-- -
# 1. Introducción

Las arquitecturas modernas ya no usan tanto HTML estático; se comunican mediante APIs (REST, GraphQL, gRPC). Estas APIs suelen expandir una superficie de ataque enorme debido a la falta de documentación o malas implementaciones de control de acceso.
## A. GraphQL: Introspection (Introspección)

GraphQL es un lenguaje de consulta para APIs moderno. A diferencia de REST, donde hay rutas fijas (`/api/users`), en GraphQL hay un solo endpoint (`/graphql`) donde pides exactamente lo que quieres.

La **Introspección** es una función nativa de GraphQL que permite consultar al propio servidor para que te devuelva el mapa completo de su estructura (todas las consultas, mutaciones, campos y tipos de datos disponibles). En producción, esta función **debe estar desactivada**.
### El Ataque de Introspección:

El auditor envía una query especial buscando el esquema:

```GraphQL
query { __schema { queryType { name } } }
```

Herramientas como _InQL_ (extensión de Burp Suite) automatizan esto para recrear visualmente toda la documentación oculta de la API. Si el auditor descubre que existen campos no documentados como `allUsers` o `isAdmin`, puede proceder a explotarlos.
## B. GraphQL: Mutations (Mutaciones)

En GraphQL, las `Queries` se usan para leer datos (equivalente a un `GET`), mientras que las `Mutations` se usan para **escribir, modificar o eliminar datos** (equivalente a un `POST/PUT/DELETE`).

- **El Abuso:** Muchas veces los desarrolladores protegen las consultas de lectura comunes, pero olvidan aplicar el middleware de autenticación sobre las mutaciones. El auditor puede descubrir mediante la introspección una mutación llamada `updateUserRole(id: 5, role: "admin")` y ejecutarla de forma directa sin estar autenticado.
## C. IDORs en APIs Modernas

Es extremadamente común que las APIs reciban parámetros de identificación de forma explícita en rutas dinámicas o en el cuerpo del JSON (ej: `GET /api/v2/users/1023/settings`). Si el backend implementa el control de acceso en la interfaz visual (Front-end) pero no valida el JWT o la sesión en el endpoint puro de la API, el auditor puede iterar sobre los números de la ruta para extraer información masiva.
# 2. Mitigación

Deshabilitar por completo las consultas de introspección (`__schema`) en los entornos de producción y asegurarse de que todas las consultas y mutaciones pasen por un módulo centralizado de control de acceso y autorización antes de interactuar con la base de datos.
-- -
