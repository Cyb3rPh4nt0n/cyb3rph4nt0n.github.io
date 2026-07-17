-- -
# 1. ¿Qué es LDAP y para qué se usa?

En entornos corporativos y grandes empresas, no se crean los usuarios aplicación por aplicación. Se utiliza un directorio centralizado (como **Active Directory** de Microsoft o OpenLDAP). Cuando inicias sesión en la intranet de la empresa, la aplicación web le pregunta al servidor LDAP: _"¿Este usuario y contraseña son válidos corporativamente?"_.

LDAP organiza la información en forma de árbol y utiliza una sintaxis de filtros muy peculiar basada en **notación polaca inversa** (los operadores van delante).

- Un filtro normal para buscar un usuario activo sería: `(&(user=juan)(status=active))` -> El `&` significa "AND". Ambas condiciones deben cumplirse.
# 2. El Ataque: Inyección LDAP

Al igual que en SQL, si la aplicación web concatena lo que introduce el usuario directamente en el filtro LDAP sin sanitizar, podemos alterar la lógica del árbol.
### Código Vulnerable (Conceptual):

```Python
# El filtro se construye concatenando la entrada del usuario
filtro = "(&(username=" + user_input + ")(password=" + pass_input + "))"
```
### El Payload del Auditor:

Imagina que en el campo de usuario (`username`) inyectamos el siguiente payload: `admin)(&)` y dejamos la contraseña en blanco o con cualquier texto.
### ¿Qué pasa en el servidor LDAP?

La consulta final se convierte en:

```Fragmento de código
(&(username=admin)(&))(password=cualquiera))
```

**Análisis técnico:** Los servidores LDAP procesan la consulta de izquierda a derecha. Al introducir el paréntesis de cierre `)` después de `admin`, **cerramos prematuramente el filtro principal**.

El servidor interpreta la consulta de la siguiente manera:

1. Evalúa `(&(username=admin)(&))`. Como el operador `&` vacío se evalúa como verdadero, esta sección se da por buena si el usuario `admin` existe.
2. **Ignora por completo** todo lo que viene después (`(password=cualquiera))`), ya que quedó fuera del filtro principal que ya se cerró.

Resultado: El auditor logra saltarse la autenticación en la intranet corporativa.
# 3. Mitigación en LDAP

Para prevenir esto, se deben escapar rigurosamente los caracteres de control de LDAP (como `*`, `(`, `)`, `&`, `|`) antes de construir el filtro, o utilizar librerías que implementen parámetros vinculados seguros para consultas de directorio.
-- -
