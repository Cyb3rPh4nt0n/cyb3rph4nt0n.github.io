-- -
# 1. ¿Qué es XPath?

Así como SQL se usa para consultar bases de datos relacionales, **XPath** es el lenguaje que se utiliza para buscar y navegar a través de datos almacenados en archivos **XML** (Extensible Markup Language). Hoy en día se ve mucho en servicios web antiguos, sistemas de configuración o APIs que procesan datos en XML.

Un archivo XML de usuarios tiene esta pinta:

```XML
<usuarios>
	<usuario>
		<nombre>admin</nombre>
		<password>P@ssw0rd123</password>
	</usuario>
</usuarios>
```

Y la aplicación web utilizará una consulta XPath para validar el login:

```XQuery
//usuario[nombre='admin' and password='password']
```
# 2. El Ataque: Inyección XPath

Si el desarrollador concatena la entrada del usuario dentro de los corchetes de la consulta XPath, estamos ante el mismo problema de siempre: podemos romper la lógica usando comillas simples.
### El Payload del Auditor:

En el campo de usuario introducimos: `' or 1=1 or 'a'='a`
### Consulta final en el motor XML:

```XQuery
//usuario[nombre='' or 1=1 or 'a' ='a' and password='...']
```

**Análisis técnico:** Como la condición `1=1` es verdadera, el motor XPath seleccionará el primer nodo `<usuario>` que encuentre en el archivo XML (generalmente el administrador), ignorando la validación de la contraseña que viene después debido a la precedencia de los operadores lógicos.
-- -
