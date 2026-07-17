-- -
Este es uno de los ataques de red web más complejos, elegantes y técnicos del panorama actual. Afecta a infraestructuras donde existe un servidor **Front-end Proxy** (como un balanceador de carga o un WAF) colocado delante de un servidor **Backend** que procesa la aplicación.
-- -
# 1. ¿Por qué ocurre? (La Desincronización)

Cuando envías múltiples peticiones HTTP a través de una misma conexión persistente (Keep-Alive), el Front-end y el Backend deben ponerse de acuerdo sobre **dónde termina una petición y dónde empieza la siguiente**. Para delimitar el tamaño de una petición, el protocolo HTTP/1.1 usa dos cabeceras:

1. `Content-Length` (CL): Indica el tamaño exacto en bytes.
2. `Transfer-Encoding: chunked` (TE): Indica que los datos vienen en bloques, donde cada bloque empieza con su tamaño en hexadecimal y termina con un bloque de tamaño `0`.

El ataque de _Request Smuggling_ ocurre cuando el auditor envía una petición maliciosa manipulada que contiene **ambas cabeceras a la vez**, y el Front-end prioriza una (ej. `Content-Length`) mientras que el Backend prioriza la otra (ej. `Transfer-Encoding`). Esto causa una **desincronización de streams**.
# 2. Ejemplo de Configuración CL.TE (Front-end usa CL, Backend usa TE):

El auditor envía la siguiente petición única estructurada con precisión milimétrica:

```HTTP
POST / HTTP/1.1
Host: vulnerable.com
Content-Length: 49
Transfer-Encoding: chunked

0

POST /perfil/modificar HTTP/1.1
X-Ignore: X
```
### ¿Qué ocurre en la infraestructura?

1. **El Front-end** lee `Content-Length: 49`. Cuenta 49 bytes (que abarca todo el texto hasta el final del parámetro `X-Ignore: X`) y reenvía el paquete completo hacia el Backend.
2. **El Backend** lee `Transfer-Encoding: chunked`. Procesa el primer bloque que dice `0`, lo que significa criptográficamente: _"Esta petición HTTP ha terminado aquí"_.
3. **El Contrabando:** Los bytes sobrantes (`POST /perfil/modificar...`) se quedan huérfanos flotando en el búfer de la memoria de la conexión del Backend.
4. **El Impacto en la Víctima:** Cuando un usuario legítimo de internet envía su propia petición normal milisegundos después (`GET /index.html`), el Backend saca los bytes huérfanos del búfer y los **concatena al principio** de la petición de la víctima. El Backend procesará la petición mezclada, haciendo que el usuario ejecute involuntariamente la acción del atacante (como modificar su perfil) o permitiendo al auditor capturar las cabeceras confidenciales del usuario legítimo.
# 3. Mitigación

Priorizar el uso absoluto de **HTTP/2** o **HTTP/3** de extremo a extremo (desde el Front-end hasta el Backend), ya que estos protocolos modernos manejan una arquitectura binaria de _frames_ multiplexados donde es matemáticamente imposible desincronizar los tamaños de las peticiones. Si se usa HTTP/1.1, configurar ambos servidores para que utilicen exactamente el mismo motor de parsing de cabeceras.
-- -
