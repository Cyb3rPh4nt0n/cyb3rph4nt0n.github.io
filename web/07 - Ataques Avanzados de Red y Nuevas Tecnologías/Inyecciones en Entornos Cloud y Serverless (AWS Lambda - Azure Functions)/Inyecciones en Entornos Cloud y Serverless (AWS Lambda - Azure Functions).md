-- -
El desarrollo moderno ha popularizado las arquitecturas _Serverless_ (sin servidor), donde el backend no corre en una máquina virtual persistente, sino en funciones efímeras que se ejecutan bajo demanda (como **AWS Lambda** o **Azure Functions**).

Aunque no hay un sistema operativo tradicional que mantener de forma continua, el código sigue siendo vulnerable a inyecciones tradicionales (Command Injection, SQLi, Local File Inclusion), pero con un **impacto totalmente adaptado a la nube**.
-- -
# 1. La Persistencia de Contexto (The Reuse of Containers)

Un error conceptual común es pensar que cada vez que se ejecuta una función Lambda, se crea un entorno de la nada y luego se destruye por completo. Para optimizar el rendimiento, los proveedores de la nube aplican el **reuso de contenedores** (_Warm Starts_). Si una función recibe muchas peticiones seguidas, se reutiliza el mismo entorno de ejecución en memoria.

- **El Ataque:** Si el auditor encuentra una vulnerabilidad de inyección de comandos o escritura de archivos (LFI) en una Lambda, puede leer o escribir en el directorio temporal `/tmp`. Almacenando un script en `/tmp`, un auditor podría recolectar o espiar datos de las peticiones de _otros usuarios_ que golpeen esa misma función milisegundos después, rompiendo el aislamiento efímero.
# 2. Exfiltración de Variables de Entorno del Entorno Cloud

En Serverless, las funciones necesitan conectarse a bases de datos en la nube o APIs de terceros. Los desarrolladores almacenan estas credenciales en las **Variables de Entorno** de la función.

- **El Impacto:** Si logras una inyección de comandos en una función Lambda, tu objetivo principal como auditor no es conseguir una _Reverse Shell_ persistente (ya que la función morirá en pocos minutos), sino ejecutar de inmediato comandos para volcar el entorno:

```Bash
env
# o específicamente en AWS
curl http://169.254.170.2/v2/credentials/
```

Al capturar estas variables, obtienes las llaves maestras del backend en la nube (roles IAM) para pivotar directamente hacia los buckets de almacenamiento (S3), bases de datos (DynamoDB) o servicios de mensajería de la empresa.
# 3. Mitigación

Aplicar políticas de mínimo privilegio estricto a los roles de ejecución de las funciones (IAM), asegurando que una Lambda comprometida solo tenga acceso al recurso mínimo que necesita para operar, y limpiar los datos del directorio `/tmp` al concluir procesos críticos.
-- -
