# Path Traversal
-- -
En esta sección, explicaremos qué es el Path Traversal, describiremos algunos ejemplos de vulnerabilidades comunes y explicaremos cómo prevenir ataques.
-- -
# 1 - ¿Qué es el Path Traversal?

El Path Traversal también conocido como Directory Traversal. Estas vulnerabilidades permiten a un atacante leer archivos arbitrarios en el servidor que ejecuta una aplicación. Esto podría incluir:

- Código y datos de la aplicación.
- Credenciales de los sistemas back-end.
- Archivos confidenciales del sistema operativo.

En algunos casos, un atacante podría escribir en archivos arbitrarios del servidor, lo que le permite modificar los datos o el comportamiento de la aplicación y, en última instancia, tomar el control total del servidor.
-- -
# 2 - Lectura de archivos arbitrarios mediante Path Traversal:

Imagine una aplicación de compras que muestre imágenes de artículos en venta. Esta podría cargar una imagen con el siguiente HTML:

`<img src="/laodImage?filename=218.png">`

La URL de **loadImage** toma un parámetro de **filename** y devuelve el contenido del archivo especificado. Los archivos de imagen se almacenan en el disco en la ubicación **/var/www/images/**. Para devolver una imagen, la aplicación añade el nombre del archivo solicitado a este directorio base y utiliza una API del sistema de archivos para leer el contenido del archivo. En otras palabras, la aplicación lee desde la siguiente ruta de archivo:

`/var/www/images/218.png`

Esta aplicación no implementa defensas contra ataques de Path Traversal. Por lo tanto, un atacante puede solicitar la siguiente URL para recuperar el archivo **/etc/passwd** del sistema de archivos del servidor:

`https://insecure-website.com/loadImage?filename=../../../../../etc/passwd`

Esto hace que la aplicación lea desde la siguiente ruta de archivo:

`/var/www/images/../../../../../etc/passwd`

La secuencia **../** es válida dentro de una ruta de archivo y significa subir un nivel en la estructura de directorios. Las tres secuencias **../** consecutivas suben desde **/var/www/images/** hasta la raíz del sistema de archivos, por lo que el archivo que se lee es:

`/etc/passwd`

En los sistemas operativos basados en Unix, este es un archivo estándar que contiene detalles de los usuarios registrados en el servidor, pero un atacante podría recuperar otros archivos arbitrarios utilizando la misma técnica.

En Windows, tanto ../ como ..\ son secuencias válidas para atravesar directorios. El siguiente es un ejemplo de un ataque equivalente contra un servidor Windows:

`https://insecure.website.com/loadImage?filename=..\..\..\..\..\windows\win.ini`
-- -
# 3 - Obstáculos comunes para explotar vulnerabilidades de recorrido de ruta:

Muchas aplicaciones que introducen la información del usuario en las rutas de archivos implementan defensas contra ataques Path Traversal. Estas suelen poder eludirse.

Si una aplicación elimina o bloquea las secuencias de Path Traversal del nombre de archivo proporcionado por el usuario, es posible eludir la defensa mediante diversas técnicas.

Es posible usar una ruta absoluta desde la raíz del sistema de archivos, como **filename=/etc/passwd**, para referenciar directamente un archivo sin usar secuencias de cruce

Es posible que puedas usar secuencias de recorrido anidadas, como **....//** o **....\\/**. Estas se convierten en secuencias de recorrido simples cuando se elimina la secuencia interna.

En algunos contextos, como en una ruta URL o en el parámetro de **filename** de una solicitud **multipart/form-data**, los servidores web pueden eliminar cualquier secuencia de recorrido de directorio antes de pasar la entrada a la aplicación. En ocasiones, se puede evitar este tipo de limpieza codificando la URL, o incluso duplicando la codificación de la URL, con los caracteres **../**. Esto genera **%2e%2e%2f** y **%252e%252e%252f** respectivamente. Diversas codificaciones no estándar, como **..%c0%af** o **..%ef%bc%8f**, también puede funcionar.

Para los usuarios de Burp Suite Professional, Burp Intruder proporciona la lista de payloads predefinida Fuzzing - Path Traversal. Esta contiene algunas secuencias de recorrido de ruta codificadas que puede probar.

Una aplicación puede requerir que el filename proporcionado por el usuario comience con la carpeta base esperada, como **/var/www/images**. En este caso, se podría incluir la carpeta base requerida seguida de secuencias de navegación adecuadas. Por ejemplo: **filename=/var/www/images/../../../etc/passwd**.

Una aplicación puede requerir que el filename proporcionado por el usuario termine con una extensión esperada, como **.png**. En este caso, se podría usar un null byte para terminar la ruta del archivo antes de la extensión requerida. Por ejemplo: **filename=../../../etc/passwd%00.png**.
-- -
# 4 - Cómo prevenir un ataque Path Traversal:

La forma más eficaz de prevenir vulnerabilidades Path Traversal es evitar por completo el paso de información proporcionada por el usuario a las API del sistema de archivos. Muchas funciones de aplicación que hacen esto pueden reescribirse para ofrecer el mismo comportamiento de forma más segura.

Si no puede evitar el paso de información proporcionada por el usuario a las API del sistema de archivos, recomendamos usar dos capas de defensa para prevenir ataques:

- Valide la entrada del usuario antes de procesarla. Idealmente, compare la entrada con una lista blanca de valores permitidos. Si esto no es posible, verifique que la entrada contenga únicamente contenido permitido, como solo caracteres alfanuméricos.
- Después de validar la entrada proporcionada, añádala al directorio base y utilice una API del sistema de archivos de la plataforma para canonizar la ruta. Verifique que la ruta canonizada comience con el directorio base esperado.

A continuación se muestra un ejemplo de un código Java simple para validar la ruta canónica de un archivo según la entrada del usuario:

```Java
File file = new File(BASE_DIRECTORY, userInput);
if (file.getCanonicalPath().startsWith(BASE_DIRECTORY)) {
	// process file
}
```

> LEER MÁS
>
> Find directory traversal vulnerabilities using Burp Suite's web vulnerability scanner
-- -