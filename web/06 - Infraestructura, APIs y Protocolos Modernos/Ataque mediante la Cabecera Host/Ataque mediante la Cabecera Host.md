-- -
# 1. ¿Qué es?

La cabecera HTTP `Host` es obligatoria desde HTTP/1.1. Le dice al servidor web qué dominio específico está buscando el cliente (vital cuando un solo servidor aloja múltiples páginas web utilizando _Virtual Hosts_).

El ataque ocurre cuando la aplicación web confía ciegamente en el valor de la cabecera `Host` enviada por el navegador para generar enlaces internos dinámicos (como enlaces de restablecimiento de contraseña o la carga de scripts).
# 2. Escenario de Explotación:
### Envenenamiento de Enlaces de Contraseña

1. Vas a la sección de "Olvidé mi contraseña" y pones el correo del administrador.
2. Interceptas la petición en Burp Suite y modificas la cabecera `Host`:

```HTTP
POST /password-reset HTTP/1.1
Host: servidor-auditor.local
...
```

3. El backend procesa la solicitud con éxito, genera el token secreto para el administrador, pero al construir el cuerpo del correo electrónico que le va a enviar, utiliza el valor de la cabecera `Host` modificada: _"Hola Admin, haz clic aquí para cambiar tu clave: `http://servidor-auditor.local/reset?token=a8f391b`"_
4. El administrador recibe el correo legítimo, hace clic pensando que es real, y su navegador enviará el token secreto directamente al servidor del auditor.
# 3. Mitigación

Configurar el servidor web (Apache, Nginx, IIS) de modo que valide rigurosamente la cabecera contra una lista de dominios autorizados y, si no coincide, tire la petición de inmediato (`444 No Response` o `400 Bad Request`).
-- -
