-- -
# 1. ¿Qué es?

La **Enumeración** consiste en abusar de las respuestas del servidor para confirmar si un recurso específico (como un nombre de usuario, un correo electrónico o un ID de cuenta) existe o no en la base de datos del sistema.

Aunque a veces se considera una vulnerabilidad de severidad baja por sí sola, en el mundo real es el **bloque de construcción esencial para ataques masivos** de fuerza bruta, phishing dirigido o robo de cuentas.
# 2. Mecanismos de Enumeración Comunes:
### A. Discrepancia en los Mensajes de Error (El clásico)

Vas al formulario de inicio de sesión o de recuperación de contraseña y pruebas dos entradas:

- Entrada 1: `noexiste_12345@correo.com` -> El servidor responde: _"El usuario no existe"_.
- Entrada 2: `admin@empresa.com` -> El servidor responde: _"Contraseña incorrecta"_.
- _Impacto:_ El servidor te acaba de confirmar que `admin@empresa.com` es una cuenta real en el sistema.
### B. Enumeración Basada en Tiempo (Timing Attacks)

Los desarrolladores modernos intentan evitar lo anterior poniendo un mensaje genérico: _"Si el correo existe, recibirás un enlace"_. Sin embargo, un auditor puede medir el tiempo de respuesta del servidor (en milisegundos).

- Si metes un correo falso, el servidor hace una consulta rápida a la base de datos, ve que no existe, y responde en **50ms**.
- Si metes un correo real, el servidor calcula el hash de la contraseña, genera un token criptográfico, llama al servicio de e-mail (SMTP) para enviar el correo y responde en **800ms**.
- _Impacto:_ Midiendo los tiempos de respuesta de forma automatizada, puedes mapear qué correos son válidos y cuáles no.
# 3. Mitigación de Enumeración de Usuarios/Reecursos

**Enumeración:** Utilizar respuestas e interfaces idénticas para escenarios de éxito y fallo (ej: _"Las credenciales introducidas son incorrectas o la cuenta no existe"_), y añadir retrasos artificiales estandarizados en el backend para neutralizar los ataques basados en tiempo.
-- -
