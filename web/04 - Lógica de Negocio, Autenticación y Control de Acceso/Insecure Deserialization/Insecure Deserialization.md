-- -
# 1. ¿Qué es la Serialización y Deserialización?

- **Serialización:** Es el proceso de convertir un objeto complejo de la memoria de un programa (en lenguajes como Java, PHP, Python o Node.js) en un formato de texto o binario (un string) para que pueda ser guardado en un archivo, una base de datos o enviado a través de la red.
- **Deserialización:** Es el proceso inverso; tomar ese string o bytes y volverlo a transformar en un objeto vivo dentro de la memoria del servidor.
# 2. El Peligro del Ataque

El ataque ocurre cuando la aplicación web **recibe un objeto serializado controlado por el usuario** (por ejemplo, guardado dentro de una cookie) y lo deserializa sin validar su procedencia.

Si el auditor manipula los datos dentro del objeto serializado o abusa de funciones mágicas nativas del lenguaje (como `__wakeup()` en PHP o `readObject()` en Java) que se ejecutan automáticamente al reconstruir el objeto, puede forzar al servidor a realizar acciones inesperadas, resultando casi siempre en **RCE (Remote Code Execution)**.
### Ejemplo Conceptual en PHP:

Una web guarda tu información de sesión en una cookie serializada:

- Objeto legítimo en memoria: `User(username="juan", is_admin=false)`
- String serializado en la cookie: `O:4:"User":2:{s:8:"username";s:4:"juan";s:8:"is_admin";b:0;}`

Si el auditor cambia el valor booleano final `b:0;` por `b:1;` (`is_admin=true`) y refresca la página, cuando el servidor haga un `unserialize()`, reconstruirá el objeto otorgándole privilegios de administrador de forma inmediata.

Si además inyecta estructuras de clases peligrosas (conocidas como _Property Oriented Programming_ o **POP Chains**), puede invocar comandos en el sistema.
# 3. Mitigación

- **Rate Limiting:** Implementar bloqueos por IP y por cuenta usando algoritmos como _Token Bucket_ (por ejemplo, con herramientas como Redis o a nivel de WAF/Nginx).
- **Autenticación Fuerte:** Utilizar tokens de sesión generados por librerías criptográficamente seguras (mínimo 128 bits de entropía) y frameworks de autenticación consolidados (como OAuth2 o contraseñas Hasheadas con Argon2 o bcrypt).
- **Deserialización Segura:** Nunca deserializar datos que provengan del cliente. Si es necesario pasar estructuras de datos complejas, utilizar formatos de intercambio puros y planos como **JSON** o **XML** (restringiendo entidades externas), los cuales no ejecutan código al ser procesados.
-- -
