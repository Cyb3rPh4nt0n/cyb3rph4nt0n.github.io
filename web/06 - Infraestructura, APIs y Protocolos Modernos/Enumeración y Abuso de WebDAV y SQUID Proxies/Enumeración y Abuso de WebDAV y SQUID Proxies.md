-- -
# 1. WebDAV (Web Distributed Authoring and Versioning)

WebDAV es una extensión del protocolo HTTP que permite a los usuarios gestionar, editar y transferir archivos directamente en un servidor web, transformando la web en una especie de disco duro compartido (similar a un FTP pero sobre HTTP).
### El Abuso:

Si un servidor tiene WebDAV activo y carece de autenticación robusta o sufre de malas configuraciones en los métodos HTTP permitidos, un auditor puede abusar de métodos no estándar para comprometer el entorno:

- **Método `PUT`:** Permite subir archivos directamente a la raíz web. Si el auditor sube un script malicioso (`shell.php` o `shell.aspx`) y el directorio tiene permisos de ejecución, se obtiene un RCE directo.
- **Método `MOVE` o `PROPFIND`:** Permite listar la estructura de directorios protegidos o renombrar archivos existentes (por ejemplo, cambiar la extensión de un archivo de texto subido a `.php` para forzar su ejecución).
# 2. SQUID Proxies (Abuso de Proxies Internos)

Squid es un software de proxy de caché web muy popular en entornos corporativos para controlar y optimizar la navegación de los empleados hacia internet.
### El Abuso (Proxy Abierto / Open Proxy)

Si un servidor Squid está mal configurado y expuesto hacia el exterior sin restricciones de ACL (Access Control Lists), se convierte en un _Open Proxy_. Un auditor puede configurar su propio navegador para navegar _a través_ del Squid corporativo. Esto permite:

1. **Saltarse Restricciones:** Acceder a la red interna de la empresa simulando que el tráfico proviene de la propia IP local del proxy (un pivote de red).
2. **Anonimato:** Utilizar la infraestructura de la víctima para lanzar ataques hacia terceros, enmascarando la verdadera IP del auditor.
# 3. Mitigación

Deshabilitar los métodos HTTP peligrosos (`PUT`, `MOVE`, `DELETE`) en WebDAV si no son estrictamente necesarios, y cerrar los puertos de Squid Proxy (`3128`) al tráfico externo mediante reglas de Firewall robustas.
-- -
