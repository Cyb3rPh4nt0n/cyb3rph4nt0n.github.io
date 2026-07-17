-- -
Aunque lo mencionamos brevemente en la introducción, las Condiciones de Carrera a nivel de lógica de control requieren un análisis minucioso de hilos de ejecución en el servidor web.
-- -
# 1. El Mecanismo Subyacente: TOCTOU (Time-of-Check to Time-of-Use)

Este fallo ocurre cuando hay una brecha de tiempo imperceptible entre el momento en que la aplicación web **verifica una condición** (Check) y el momento en que **utiliza/aplica la acción** resultante (Use).

```
Hilo 1 (Petición A)                         Hilo 2 (Petición B)
   |                                           |              
   +--> [CHECK] ¿Saldo > $10? SÍ               |
   |                                           +--> [CHECK] ¿Saldo > $10? SÍ
   +--> [USE] Retira $10 y descuenta           |
   |                                           +--> [USE] Retira $10 y descuenta
```

Si envías dos o más peticiones en paralelo que golpeen exactamente la misma función en el mismo microsegundo, el Hilo 2 puede pasar la inspección de seguridad (`[CHECK]`) antes de que el Hilo 1 termine de restar el saldo de la cuenta.
# 2. Cómo lo explota un Auditor en el Laboratorio:

Para demostrar este fallo de forma profesional, ya no se envían peticiones una tras otra de forma manual. Se utiliza la funcionalidad nativa de **Burp Suite Suite (Repeater con "Parallel Requests")** o scripts multihilo.

1. Se configuran múltiples pestañas idénticas en el Repeater (ej: la petición de canjear un código de regalo de un solo uso).
2. Se agrupan las pestañas en un _Tab Group_.
3. Se selecciona la opción **"Send group in parallel (single-packet attack)"**.
4. Burp Suite enviará los paquetes de red de tal forma que lleguen al servidor web apelotonados exactamente al mismo tiempo, forzando la colisión de hilos en el backend y permitiendo canjear el cupón varias veces simultáneamente.
# 3. Mitigación de Race Conditions

Implementar exclusión mutua mediante mecanismos de bloqueo a nivel de registro en la base de datos (por ejemplo, cláusulas como `SELECT ... FOR UPDATE` o transacciones con nivel de aislamiento serializable), o bloqueos atómicos distribuidos (utilizando Redis).
-- -
