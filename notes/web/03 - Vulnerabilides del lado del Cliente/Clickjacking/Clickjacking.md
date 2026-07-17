-- -
# 1. ¿Qué es y por qué ocurre?

El Clickjacking (también conocido como _UI Redressing_ o rediseño de la interfaz de usuario) es un ataque visual. Ocurre cuando un atacante **engaña a un usuario para que haga clic en un elemento de una página web legítima que es invisible o está oculto bajo una capa transparente**, cuando el usuario pensaba que estaba haciendo clic en otra cosa (como un juego o un botón de "Ganar premio").

Esto se logra abusando de una característica nativa de HTML: las etiquetas `<iframe>` (que permiten incrustar una página web dentro de otra) combinadas con CSS para manipular la opacidad.
# 2. El Ataque Paso a Paso:

Imagina que estás auditando una red social que tiene un botón crítico en la ruta `http://redsocial.com/eliminar-cuenta`.

1. El atacante crea una página web maliciosa (`http://web-atacante.com`) con un juego muy simple que dice: _"Haz clic aquí para ganar un iPhone"_.
2. Encima de ese botón de "Ganar", el atacante carga un `<iframe>` que apunta a `http://redsocial.com/eliminar-cuenta`.
3. Usando CSS, el atacante hace que el iframe de la red social sea **completamente invisible** (`opacity: 0;`) y lo posiciona exactamente encima del botón del juego.
4. Si la víctima ha iniciado sesión en la red social y hace clic en "Ganar premio", en realidad **su clic traspasa la capa visual y pulsa el botón invisible de "Eliminar cuenta"**. El navegador procesa el clic con la sesión de la víctima y ejecuta la acción sin su consentimiento.
# 3. Mitigación de Clickjacking

Para solucionar esto, el servidor de la aplicación web debe decirle al navegador: _"Prohíbe terminantemente que mi página web sea metida dentro de un iframe por terceros"_. Esto se hace con dos cabeceras de seguridad:

1. **Cabecera `X-Frame-Options` (XFO):** (Clásica pero efectiva)

	- `X-Frame-Options: DENY` -> Ninguna web (ni la mía propia) puede meter esta página en un iframe.
	- `X-Frame-Options: SAMEORIGIN` -> Solo yo puedo incrustar mi propia página en un iframe.

2. **Cabecera `Content-Security-Policy` (CSP) con la directiva `frame-ancestors`:** (La solución moderna y recomendada)

	- `Content-Security-Policy: frame-ancestors 'none';` -> Equivalente a DENY.
	- `Content-Security-Policy: frame-ancestors 'self';` -> Equivalente a SAMEORIGIN.
-- -
