-- -
# 1. ¿Qué es un Prototipo?

En JavaScript, casi todo es un objeto. Los objetos heredan propiedades y métodos de un objeto padre llamado **Prototipo** (`Object.prototype`). Si modificas el prototipo global base, **todos los objetos de la aplicación heredarán esa nueva propiedad**.
### Cómo ocurre la contaminación:

Ocurre cuando la aplicación web realiza fusiones recurrentes o copia propiedades de un objeto controlado por el usuario (como un JSON malicioso) dentro de otro objeto de forma insegura (utilizando funciones de clonación profunda mal programadas).
### El Ataque:

El auditor inyecta la propiedad mágica `__proto__` dentro del JSON enviado a la API:

```JSON
{
	"__proto__": {
		"es_administrador": true
	}
}
```

Si el backend procesa este objeto de forma insegura, en lugar de crear una propiedad normal, inyectará `"es_administrador": true` directamente en el `Object.prototype` global de la memoria de Node.js.

A partir de ese milisegundo, cualquier objeto nuevo que cree la aplicación web para cualquier otro usuario del sistema (ej: `const usuario = {}`) tendrá por defecto la propiedad `usuario.es_administrador` establecida en `true`. Has alterado las reglas lógicas de la memoria del servidor.
-- -
