-- -
# 1. Type Juggling (Malabarismo de Tipos en PHP)

PHP es un lenguaje de tipado dinámico y débil. Esto significa que intenta ser "inteligente" y convertir variables de un tipo a otro automáticamente cuando realizas comparaciones si usas el operador de comparación débil (`==`). El operador seguro es la comparación estricta (`===`), que verifica tanto el valor como el tipo de dato.
### La Trampa de la Conversión:

En versiones de PHP anteriores a la 8.0, si comparas un string de texto plano contra el número entero `0` usando el comparador débil, PHP intentará convertir el string a un número. Como el string no empieza por números, PHP lo evalúa internamente como `0`.

- `"cualquier_cosa" == 0` -> **Verdadero (True)**
- `"135contraseña" == 135` -> **Verdadero (True)** (PHP extrae los números del principio).
### Escenario de Explotación (Bypass de Autenticación):

Imagina un backend que genera un token secreto numérico aleatorio para recuperar la contraseña:

```PHP
$token_secreto = rand(1, 999999); // El servidor genera por ejemplo 48291
// El usuario envía su token por JSON, pero inyecta un valor booleano o un 0
$input_usuario = json_decode($_POST['json_data'])->token;

if ($input_usuario == $token_secreto) {
	// ¡Acceso concedido!
}
```

Si el auditor envía en el JSON el valor booleano `true` o el número `0` en lugar de una cadena, la lógica débil de PHP hará que `true == 48291` o `0 == "token_string"` devuelva **True**, saltándose la validación criptográfica sin necesidad de adivinar el token real.
-- -
