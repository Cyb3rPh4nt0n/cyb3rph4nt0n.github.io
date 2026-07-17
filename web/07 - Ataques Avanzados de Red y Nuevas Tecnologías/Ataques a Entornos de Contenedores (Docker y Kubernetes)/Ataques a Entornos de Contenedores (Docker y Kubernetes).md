-- -
El paradigma moderno se basa en empaquetar aplicaciones en contenedores (Docker) y gestionarlos a escala con orquestadores (Kubernetes). Los auditores buscan saltar del aislamiento del contenedor hacia la máquina host subyacente (**Container Escape**).
-- -
# 1. Docker: Abuso del Socket (`docker.sock`)

El archivo `/var/run/docker.sock` es la API de Unix que permite comunicarse con el demonio de Docker para crear, arrancar o destruir contenedores.

- **La Mala Configuración:** A veces, para que una aplicación monitorice el estado de los contenedores, los administradores montan este socket _dentro_ de un contenedor de forma insegura.
- **El Escape:** Si un auditor consigue RCE en ese contenedor y detecta el socket, puede interactuar con él instalando el cliente de Docker o usando `curl`. El auditor solicita la creación de un nuevo contenedor de forma remota, pero configurándolo para que **monte la raíz del disco duro real de la máquina Host (`/`)** dentro de él.

```Bash
curl --unix-socket /var/run/docker.sock -H "Content-Type: application/json" -d '{"Image":"alpine","Cmd":["cat","/host/etc/shadow"],"HostConfig":{"Binds":["/:/host"]}}' http://localhost/containers/create
```

Al arrancar ese contenedor, el auditor accede a todos los archivos secretos de la máquina física anfitriona. Escape completado.
# 2. Kubernetes: Explotación de Service Accounts y la API

Por defecto, cada _Pod_ (contenedor) en Kubernetes tiene montado automáticamente un token de cuenta de servicio en la ruta `/var/run/secrets/kubernetes.io/serviceaccount/token`.

- **El Abuso:** Si el clúster sufre de malas configuraciones en los permisos **RBAC (Role-Based Access Control)** y ese token tiene asignados privilegios excesivos, el auditor puede usar ese string para autenticarse frente a la API interna de Kubernetes (`https://kubernetes.default.svc`).
- Utilizando la herramienta `kubectl`, puede listar otros pods, extraer secretos de bases de datos o inyectar código en contenedores de producción de otros clientes.
# 3. Mitigación

No montar jamás el `docker.sock` en contenedores expuestos a internet y aplicar el principio de mínimo privilegio en los roles RBAC de Kubernetes (deshabilitando el montaje automático de tokens si no se requieren).
-- -
