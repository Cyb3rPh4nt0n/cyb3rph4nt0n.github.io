-- -
Ya vimos el SSRF básico. En entornos avanzados distribuidos y nuevas tecnologías, los auditores deben saltarse los filtros modernos que implementan las aplicaciones mediante el abuso de características de red y protocolos específicos.
-- -
# 1. Evasión mediante DNS Rebinding (Reenlace DNS)

Muchos filtros de SSRF utilizan una validación basada en la resolución de nombres: cuando le pasas una URL, el servidor web resuelve el dominio, comprueba si la IP es pública, y si es así, permite la petición.

El **DNS Rebinding** es una técnica que engaña al servidor cambiando la IP de resolución en tiempo récord:

1. El auditor registra un dominio propio (ej. `ataque-ssrf.com`) y configura un servidor DNS malicioso controlado por él.
2. El servidor DNS está programado para cambiar de opinión constantemente: la primera vez que pregunten por el dominio, responderá con una IP legítima pública (`1.2.3.4`). La segunda vez que pregunten, responderá con la IP local interna (`127.0.0.1` o `169.254.169.254`).
3. **El Bypass:** El servidor web vulnerable recibe la URL `http://ataque-ssrf.com/secreto`. El filtro comprueba el dominio: resuelve la IP, recibe la IP pública `1.2.3.4` y dice: _"Perfecto, es una IP segura fuera de mi red corporativa"_. El filtro aprueba la petición.
4. Cuando la función web procede a realizar la conexión HTTP real milisegundos después, vuelve a consultar al DNS. El DNS del auditor responde ahora con `127.0.0.1`. El servidor web acaba conectándose a su propio puerto interno de administración, evadiendo el filtro por completo.
# 2. Abuso de Protocolos Alternativos (smb://, gopher://)

Si la función del backend que realiza la petición no utiliza una librería HTTP estricta, sino herramientas genéricas del sistema o librerías multi-protocolo (como `cURL`), el auditor puede cambiar el esquema `http://` por protocolos mucho más agresivos:

- **`gopher://`**: El protocolo Gopher permite enviar bytes en crudo a través de la red. Mediante un SSRF con `gopher://`, un auditor puede forzar al servidor web a enviar comandos en texto plano hacia servidores internos de **Redis** o **Memcached** que no requieran autenticación, logrando ejecución de comandos en la red interna.
# 3. Mitigación

Configurar el resolvedor de DNS local para que ignore tiempos de vida (TTL) sospechosamente cortos o utilizar herramientas de resolución de red seguras que verifiquen el destino final de la IP _justo en el momento exacto_ de abrir el socket de conexión TCP, bloqueando IPs privadas.
-- -
