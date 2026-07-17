-- -
Para cerrar esta primera parte de la Fase 4, hablemos del **CSTI**. ¿Te acuerdas del SSTI que vimos en la Fase 2 (donde inyectábamos operaciones matemáticas en motores de plantillas como Jinja2 en el servidor)? El CSTI es exactamente lo mismo, pero ocurre en **motores de plantillas del Front-end (lado del cliente)**, como **AngularJS** o **Vue.js**.
-- -
# 1. ¿Cómo ocurre?

Ocurre cuando una aplicación web utiliza un framework de JavaScript como AngularJS en el navegador, y el HTML de la página mezcla contenido del servidor con las directivas del cliente de forma insegura.
# 2. El Ataque (Fuzzing)

Si una web utiliza AngularJS y refleja tu input en la pantalla, puedes probar a enviarle: `{{7*7}}`.

Si el servidor te devuelve la página y el framework AngularJS del navegador procesa el HTML, verá los dobles corchetes, ejecutará la operación en tu ordenador y verás impreso un **49**.
# 3. El Impacto: De CSTI a XSS

Dado que estamos en el lado del cliente, no podemos ejecutar comandos del sistema (RCE) como en el SSTI. El objetivo de un CSTI es **romper el sandbox (entorno de aislamiento) del framework de JavaScript para ejecutar un XSS**.

Por ejemplo, en versiones antiguas de AngularJS, un payload clásico para transformar un CSTI en un XSS (ejecutar un alert) requería abusar del objeto `$eval`:

```HTML
{{constructor.constructor('alert(1)')()}}
```
-- -
