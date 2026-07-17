-- -
# 1. ¿Qué es?

La Transferencia de Zona (**AXFR - Asynchronous Full Transfer Zone**) es un protocolo legítimo utilizado por los servidores DNS para replicar y sincronizar sus bases de datos de nombres de dominio entre servidores primarios y secundarios.

El fallo de infraestructura ocurre cuando un administrador configura erróneamente el servidor DNS principal (como Bind9) y **permite que cualquier dirección IP anónima de internet solicite una transferencia AXFR**.
# 2. El Impacto en el Reconocimiento

Un auditor puede usar herramientas como `dig` o `dnsrecon` para solicitar esta transferencia:

```bash
dig axfr @dns-vulnerable.com dominio-objetivo.com
```

Si el servidor es vulnerable, responderá entregando **el mapa completo de la infraestructura interna de la organización**: todos los subdominios, direcciones IP privadas, registros de correo (MX), servidores de desarrollo ocultos (ej: `pruebas-interno.dominio.com`) y registros TXT. Esto ahorra semanas de reconocimiento pasivo y expone la superficie interna de la organización de golpe.
# 3. Mitigación

Configurar los servidores de nombres para que restrinjan las transferencias de zona de forma explícita (`allow-transfer { none; };` o limitarlo exclusivamente a las direcciones IP fijas de los servidores DNS secundarios específicos).
-- -
