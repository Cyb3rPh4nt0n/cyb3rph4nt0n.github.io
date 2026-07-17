-- -
# 1. ¿Cómo funciona el mecanismo de confianza del Navegador?

Cuando tú inicias sesión en tu banco (`banco.com`), el servidor te da una cookie de sesión. A partir de ese momento, **cada vez que tu navegador haga una petición a `banco.com`, adjuntará automáticamente esa cookie** para demostrar que eres tú.

El problema es que al navegador no le importa _quién_ originó la petición. Si estás autenticado en el banco y visitas una página de memes maliciosa (`web-atacante.com`), esa web puede tener un script que obligue a tu navegador a enviar una petición al banco. El navegador le pegará tu cookie automáticamente.
# 2. El Escenario Vulnerable (Sin Tokens)

Imagina que para cambiar la contraseña en `banco.com`, el sitio web procesa un formulario que envía una petición `POST` simple a la ruta `/config/password` con los parámetros: `new_pass=Hacked123`.

Si el desarrollador no ha implementado medidas de protección, la web es vulnerable a CSRF.
# 3. El Ataque paso a paso:

1. El atacante monta una web aparentemente inofensiva (`web-maliciosa.com`).
2. Dentro del código de esa web, esconde un formulario HTML oculto que apunta directamente al banco de la víctima:

```HTML
<form id="csrfForm" action="http://banco.com/config/password" method="POST">
	<input type="hidden" name="new_pass" value="Hacked123" />
</form>
<script>
	// Forzamos el envío del formulario automáticamente al cargar la página
	document.getElementById('csrfForm').submit();
</script>
```

3. El atacante engaña a la víctima (que tiene su sesión del banco abierta en otra pestaña) para que visite `web-maliciosa.com`.
4. El formulario se envía solo. El navegador de la víctima ve que la petición va dirigida a `banco.com`, **le añade la cookie de sesión legítima de la víctima** y la envía.
5. El servidor del banco recibe la petición con la cookie correcta, piensa que la víctima rellenó el formulario de forma voluntaria, y le cambia la contraseña. ¡Cuenta comprometida!
# 4. Mitigación de CSRF

Hoy en día, el CSRF se combate principalmente con dos mecanismos:

1. **Tokens Anti-CSRF (Synchronizer Token Pattern):** El servidor genera una cadena aleatoria, única y secreta para cada sesión de usuario (el Token). Cada vez que el usuario va a enviar un formulario, la web incluye ese token en un campo oculto. Cuando el formulario llega al servidor, este comprueba si el token coincide. Como la `web-maliciosa.com` no puede adivinar el token secreto del usuario, sus peticiones forzadas serán rechazadas inmediatamente.
2. **Atributo `SameSite` en las Cookies:** Es una directiva moderna para las cookies.

	- `SameSite=Strict`: El navegador **nunca** enviará la cookie si la petición se originó desde un sitio web externo.
	- `SameSite=Lax`: El navegador solo enviará la cookie en navegaciones legítimas de nivel superior (como hacer clic en un enlace), pero la bloqueará en peticiones automáticas de formularios de terceros o llamadas de scripts externos.
-- -
