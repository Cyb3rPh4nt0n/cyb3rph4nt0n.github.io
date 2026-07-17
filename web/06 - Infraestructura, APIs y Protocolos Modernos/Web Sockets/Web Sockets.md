-- -
# 1. ¿Qué son y por qué importan?

A diferencia del protocolo HTTP tradicional (donde el cliente hace una petición y el servidor responde, cerrando la comunicación), los **WebSockets** permiten establecer un canal **bidireccional y persistente** a través de una única conexión TCP. Se utiliza masivamente en chats en tiempo real, plataformas de trading financiero y notificaciones push.

La vulnerabilidad más crítica en este entorno es el **CSWSH (Cross-Site WebSocket Hijacking)** o Secuestro de WebSockets entre Sitios Cruzados, que es el equivalente al CSRF pero sobre WebSockets.
# 2. El Ataque (CSWSH)

Cuando un navegador inicia una conexión WebSocket (mediante una petición de _Handshake_ HTTP), el navegador **adjunta automáticamente las cookies de sesión** al igual que en cualquier petición estándar.

Si una aplicación no válida el encabezado `Origin` durante este intercambio inicial de datos, un sitio web malicioso externo (`attacker.com`) puede obligar al navegador de la víctima a establecer una conexión WebSocket directamente con la aplicación vulnerable (`vulnerable.com/stream`).

Una vez conectado, el script del atacante puede leer todos los datos privados que llegan en tiempo real o enviar comandos fraudulentos a través del canal persistente aprovechando el estado de autenticación de la víctima.
# 3. Mitigación

Validar de forma estricta la cabecera `Origin` en el backend durante el handshake de WebSocket para asegurar que la petición proviene de un dominio de confianza, e implementar tokens aleatorios únicos por conexión.
-- -
