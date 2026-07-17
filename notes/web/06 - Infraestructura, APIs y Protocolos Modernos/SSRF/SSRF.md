-- -
# 1. ¿Qué es y por qué ocurre?

El SSRF (Falsificación de Peticiones del Lado del Servidor) ocurre cuando una aplicación web **recibe una URL proporcionada por el usuario, y el servidor backend realiza una petición HTTP (u otro protocolo) hacia esa URL sin validar adecuadamente el destino**.

Básicamente, obligamos al servidor de la víctima a actuar como un **proxy proxy inverso** para nosotros. Dado que el servidor web suele estar ubicado dentro de una red de confianza (una DMZ o una VPC en la nube), el servidor puede alcanzar recursos internos que están completamente prohibidos y ocultos para los usuarios de internet.
# 2. Escenarios Comunes de Explotación:
### A. Escaneo de Red Interna (Intranet Fuzzing)

Imagina una web que te permite poner la URL de una imagen para usarla como foto de perfil (`?url=http://servidor.com/foto.jpg`).

- **El Ataque:** El auditor cambia la URL por una IP privada de la red interna de la empresa o por el _localhost_: `?url=http://127.0.0.1:80` o `?url=http://192.168.1.50:22`
- Si el servidor responde con un error de "Conexión rechazada" en el puerto 22, pero se queda pensando o devuelve un código diferente en el puerto 80, el auditor puede mapear todos los servidores y puertos abiertos dentro de la red corporativa interna de forma ciega.
### B. Ataques a Metadatos en la Nube (Cloud Metadata Exploitation)

Este es el santo grial del SSRF moderno. Si la web vulnerable está alojada en servicios en la nube como AWS, Google Cloud o DigitalOcean, estas infraestructuras tienen una IP interna estática común llamada **Endpoint de Metadatos** (`169.254.169.254`), a la cual solo se puede acceder desde dentro del propio servidor.

Si el auditor inyecta esa IP en el parámetro vulnerable:

- **Payload (AWS EC2):** `?url=http://169.254.169.254/latest/meta-data/iam/security-credentials/NombreRol`
- **Resultado:** El servidor consultará sus propios metadatos de AWS y le escupirá al auditor las claves de acceso de la API (`AccessKeyId`, `SecretAccessKey` y `Token`). El auditor copia esas claves en su terminal y toma el control de toda la infraestructura en la nube de la empresa.
# 3. Mitigación SSRF

Implementar una **Lista Blanca (Whitelist)** estricta de dominios permitidos a los que el servidor puede llamar. Si no es posible, prohibir explícitamente que el servidor resuelva peticiones hacia rangos de IPs privadas (RFC 1918) como `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16` y la IP de metadatos `169.254.169.254`.
-- -
