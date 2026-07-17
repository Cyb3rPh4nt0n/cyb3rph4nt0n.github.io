-- -
Este es un ataque criptográfico puro y devastador contra el cifrado simétrico (habitualmente **AES** corriendo en modo de bloques **CBC - Cipher Block Chaining**).
-- -
# 1. El Concepto de Padding (Relleno)

El cifrado por bloques requiere que los datos tengan un tamaño exacto (ej. bloques de 16 bytes). Si tu mensaje (como una cookie de sesión) mide 11 bytes, faltan 5 bytes para completar el bloque. Criptografía utiliza un estándar llamado **PKCS#7** para rellenar los huecos. En este caso, añade 5 bytes con el valor de su propia longitud: `\x05\x05\x05\x05\x05`.

Cuando el servidor descifra el bloque, realiza dos pasos secuenciales:

1. Descifra los datos usando la clave simétrica.
2. **Verifica el Padding:** Lee el último byte (ve un `05`), comprueba que los últimos 5 bytes sean efectivamente `05`. Si el padding es correcto, procesa el mensaje. Si está roto, da error.
# 2. ¿Qué es el Oráculo?

Un "oráculo" en criptografía es un sistema que te da sutiles pistas inconscientes. Una vulnerabilidad de Padding Oracle ocurre cuando el servidor web, al recibir un texto cifrado manipulado, **te responde de forma diferente dependiendo de si el error fue por un fallo general o específicamente porque el padding criptográfico estaba mal formado**.

- **Respuesta A:** El padding es correcto, pero el contenido es basura -> El servidor responde rápido con un error de la aplicación (`500 Internal Error`).
- **Respuesta B:** El padding está roto -> La librería criptográfica crashea antes de que la aplicación procese los datos y el servidor devuelve un error de descifrado o tarda un tiempo diferente.
# 3. La Explotación (Descifrar sin saber la Clave)

Aprovechando esta sutil diferencia, un auditor puede tomar una cookie cifrada y empezar a modificar sistemáticamente el último byte del bloque anterior en Burp Suite (enviando un máximo de 256 intentos por byte).

Cuando el servidor responda diciendo que el padding es _correcto_, el auditor, aplicando matemáticas de compuertas lógicas XOR entre el texto modificado y la respuesta del oráculo, puede **deducir el byte original en texto plano**. Repitiendo esto de forma automatizada hacia atrás, **puedes descifrar el mensaje completo y falsificar cookies cifradas sin conocer jamás la clave secreta del servidor**.

![alt text](<../../../../assets/img/web images/Pasted image 20260629130517.png>)
-- -
